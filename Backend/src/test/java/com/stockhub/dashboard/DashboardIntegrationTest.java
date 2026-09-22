package com.stockhub.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import tools.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Dashboard figures on a deterministic dataset, created in a fresh company:
 *
 * <pre>
 * Product  price min  operations (all today)                 levels
 * A        100   5    +20 in L1, -5 in L1, transfer 3 L1→L2   L1 = 12, L2 = 3 (low: 3 ≤ 5)
 * B         50  10    +10 in L1, -2 in L1                     L1 = 8 (low: 8 ≤ 10)
 * C         30   0    +4 in L2, -4 in L2                      L2 = 0 (out of stock)
 * D (lots)  20   0    X +3 (expires in 3 d), Y +2 (expired),  L2 = 6
 *                     Z +1 (expires in 20 d), all in L2
 * </pre>
 *
 * Every expected value below is computed by hand from this table.
 */
class DashboardIntegrationTest extends AbstractIntegrationTest {

    @Autowired JdbcTemplate jdbc;

    TenantFixture t;
    UUID l1;
    UUID l2;
    UUID productA;
    String transferNumber;

    @BeforeEach
    void dataset() throws Exception {
        t = api.newTenant("Dash");
        l1 = t.primaryLocationId();
        l2 = id(api.create("/api/v1/locations", t.admin(), Map.of("name", "Dépôt Nord", "code", "L2", "type", "WAREHOUSE")));
        productA = product("A", 100, 5, false);
        UUID b = product("B", 50, 10, false);
        UUID c = product("C", 30, 0, false);
        UUID d = product("D", 20, 0, true);
        LocalDate today = LocalDate.now(ZoneId.of("Africa/Douala"));

        entry(l1, productA, 20);
        exit(l1, productA, 5);
        entry(l1, b, 10);
        exit(l1, b, 2);
        entry(l2, c, 4);
        exit(l2, c, 4);
        entry(l2, lot(d, 3, "X", today.plusDays(3)));
        entry(l2, lot(d, 2, "Y", today.minusDays(1)));
        entry(l2, lot(d, 1, "Z", today.plusDays(20)));
        transferNumber = api.create("/api/v1/stock/transfers", t.admin(), Map.of(
                "sourceLocationId", l1, "destinationLocationId", l2,
                "lines", List.of(Map.of("productId", productA, "quantity", 3)))).get("number").asString();
    }

    @Test
    void adminSummaryOfEveryLocation() throws Exception {
        JsonNode s = summary(t.admin(), "");

        assertThat(s.at("/scope/multiLocation").asBoolean()).isTrue();
        assertThat(s.at("/scope/financial").asBoolean()).isTrue();
        assertThat(s.at("/catalogue/activeProducts").asLong()).isEqualTo(4);
        // A, B and D have stock somewhere; C is empty.
        assertThat(s.at("/catalogue/referencesInStock").asLong()).isEqualTo(3);
        // 12 + 3 + 8 + 6
        assertThat(s.at("/catalogue/totalQuantity").decimalValue()).isEqualByComparingTo("29");
        // 15 × 100 + 8 × 50 + 6 × 20
        assertThat(s.at("/catalogue/stockValue").decimalValue()).isEqualByComparingTo("2020");
        assertThat(s.at("/catalogue/currency").asString()).isEqualTo("XAF");

        // normal: A@L1, D@L2 · low: A@L2, B@L1 · out: C@L2
        assertThat(s.at("/status/normal").asLong()).isEqualTo(2);
        assertThat(s.at("/status/low").asLong()).isEqualTo(2);
        assertThat(s.at("/status/out").asLong()).isEqualTo(1);
        assertThat(s.at("/status/negative").asLong()).isZero();

        assertThat(s.at("/batches/expired").asLong()).isEqualTo(1);
        assertThat(s.at("/batches/expiringWithin7Days").asLong()).isEqualTo(1);
        assertThat(s.at("/batches/expiringSoon").asLong()).isEqualTo(2);
        assertThat(s.at("/batches/warningDays").asInt()).isEqualTo(30);

        for (String window : List.of("today", "period")) {
            JsonNode ops = s.at("/activity/" + window);
            // Entries: A, B, C, X, Y, Z · exits: A, B, C · 1 transfer (not an entry nor an exit)
            assertThat(ops.get("entries").asLong()).isEqualTo(6);
            assertThat(ops.get("exits").asLong()).isEqualTo(3);
            assertThat(ops.get("transfers").asLong()).isEqualTo(1);
            assertThat(ops.get("adjustments").asLong()).isZero();
            assertThat(ops.get("entryQuantity").decimalValue()).isEqualByComparingTo("40");
            assertThat(ops.get("exitQuantity").decimalValue()).isEqualByComparingTo("11");
        }

        JsonNode byLocation = s.get("byLocation");
        assertThat(byLocation).hasSize(2);
        // L1: 12 × 100 + 8 × 50 · L2: 3 × 100 + 6 × 20
        assertThat(byLocation.get(0).get("locationId").asString()).isEqualTo(l1.toString());
        assertThat(byLocation.get(0).get("stockValue").decimalValue()).isEqualByComparingTo("1600");
        assertThat(byLocation.get(0).get("referencesInStock").asLong()).isEqualTo(2);
        assertThat(byLocation.get(1).get("name").asString()).isEqualTo("Dépôt Nord");
        assertThat(byLocation.get(1).get("stockValue").decimalValue()).isEqualByComparingTo("420");
        assertThat(byLocation.get(1).get("quantity").decimalValue()).isEqualByComparingTo("9");

        assertThat(s.at("/attention/outOfStock/0/productName").asString()).isEqualTo("C");
        assertThat(s.at("/attention/lowStock")).hasSize(2);
        assertThat(s.at("/attention/expiredBatches/0/batchNumber").asString()).isEqualTo("Y");
        assertThat(s.at("/attention/expiringBatches/0/batchNumber").asString()).isEqualTo("X");
        assertThat(s.at("/attention/expiringBatches/1/batchNumber").asString()).isEqualTo("Z");
    }

    @Test
    void locationFilterNarrowsEveryFigure() throws Exception {
        JsonNode s = summary(t.admin(), "&locationId=" + l2);

        // L2: A 3, C 0, D 6
        assertThat(s.at("/catalogue/totalQuantity").decimalValue()).isEqualByComparingTo("9");
        assertThat(s.at("/catalogue/stockValue").decimalValue()).isEqualByComparingTo("420");
        assertThat(s.at("/status/normal").asLong()).isEqualTo(1);
        assertThat(s.at("/status/low").asLong()).isEqualTo(1);
        assertThat(s.at("/status/out").asLong()).isEqualTo(1);
        // Entries in L2: C, X, Y, Z · exits: C · the incoming transfer is counted as a transfer.
        assertThat(s.at("/activity/period/entries").asLong()).isEqualTo(4);
        assertThat(s.at("/activity/period/exits").asLong()).isEqualTo(1);
        assertThat(s.at("/activity/period/transfers").asLong()).isEqualTo(1);
        // A filtered view never compares locations.
        assertThat(s.get("byLocation")).isEmpty();
    }

    @Test
    void stockFlowIsAggregatedPerBucketAndZeroFilled() throws Exception {
        JsonNode week = api.getJson("/api/v1/dashboard/stock-flow?period=7D", t.admin());
        assertThat(week.at("/period/granularity").asString()).isEqualTo("DAY");
        JsonNode points = week.get("points");
        assertThat(points).hasSize(7);
        for (int i = 0; i < 6; i++) {
            assertThat(points.get(i).get("entries").asLong()).isZero();
        }
        JsonNode today = points.get(6);
        assertThat(today.get("bucket").asString()).startsWith(LocalDate.now(ZoneId.of("Africa/Douala")).toString());
        assertThat(today.get("entries").asLong()).isEqualTo(6);
        assertThat(today.get("exits").asLong()).isEqualTo(3);
        assertThat(today.get("entryQuantity").decimalValue()).isEqualByComparingTo("40");
        assertThat(today.get("exitQuantity").decimalValue()).isEqualByComparingTo("11");

        JsonNode hours = api.getJson("/api/v1/dashboard/stock-flow?period=TODAY", t.admin());
        assertThat(hours.at("/period/granularity").asString()).isEqualTo("HOUR");
        assertThat(hours.get("points")).hasSize(24);
        long entries = 0;
        for (JsonNode point : hours.get("points")) entries += point.get("entries").asLong();
        assertThat(entries).isEqualTo(6);

        JsonNode year = api.getJson("/api/v1/dashboard/stock-flow?period=1Y", t.admin());
        assertThat(year.at("/period/granularity").asString()).isEqualTo("MONTH");
        assertThat(year.get("points").size()).isBetween(12, 13);
    }

    @Test
    void recentActivityAndTopMovements() throws Exception {
        JsonNode recent = api.getJson("/api/v1/dashboard/recent-activity?limit=3", t.admin());
        assertThat(recent).hasSize(3);
        JsonNode transfer = recent.get(0);
        assertThat(transfer.get("type").asString()).isEqualTo("TRANSFER");
        assertThat(transfer.get("number").asString()).isEqualTo(transferNumber);
        assertThat(transfer.get("productName").asString()).isEqualTo("A");
        assertThat(transfer.get("quantity").decimalValue()).isEqualByComparingTo("3");
        assertThat(transfer.at("/location/id").asString()).isEqualTo(l1.toString());
        assertThat(transfer.at("/destination/name").asString()).isEqualTo("Dépôt Nord");
        assertThat(transfer.get("performedByName").asString()).isEqualTo("Ada Admin");

        JsonNode exits = api.getJson("/api/v1/dashboard/recent-activity?type=EXIT", t.admin());
        assertThat(exits).hasSize(3);
        assertThat(exits.get(0).get("quantity").decimalValue()).isEqualByComparingTo("-4");

        JsonNode top = api.getJson("/api/v1/dashboard/top-movements?period=30D", t.admin()).get("products");
        // A: entry, exit, transfer = 3 notes; D: 3 entries; B and C: 2 each.
        assertThat(top.get(0).get("name").asString()).isIn("A", "D");
        assertThat(top.get(0).get("operations").asLong()).isEqualTo(3);
        JsonNode a = top.get(0).get("name").asString().equals("A") ? top.get(0) : top.get(1);
        assertThat(a.get("enteredQuantity").decimalValue()).isEqualByComparingTo("20");
        assertThat(a.get("exitedQuantity").decimalValue()).isEqualByComparingTo("5");
        assertThat(top).hasSize(4);
    }

    @Test
    void storekeeperSeesHisLocationsWithoutFinancialFigures() throws Exception {
        Session storekeeper = api.userSession(t.admin(), "MAGASINIER", List.of(l2));
        JsonNode s = summary(storekeeper, "");

        assertThat(s.at("/scope/financial").asBoolean()).isFalse();
        assertThat(s.at("/scope/multiLocation").asBoolean()).isFalse();
        // Not computed, hence not sent at all (null fields are omitted).
        assertThat(s.get("catalogue").has("stockValue")).isFalse();
        assertThat(s.get("catalogue").toString()).doesNotContain("stockValue");
        assertThat(s.at("/catalogue/totalQuantity").decimalValue()).isEqualByComparingTo("9");
        assertThat(s.get("byLocation")).isEmpty();

        mvc.perform(get("/api/v1/dashboard/summary?locationId=" + l1).header("Authorization", storekeeper.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LOCATION_ACCESS_DENIED"));

        // The transfer from L1 is not visible: both sides of a note must be accessible.
        JsonNode recent = api.getJson("/api/v1/dashboard/recent-activity?limit=20", storekeeper);
        assertThat(recent).extracting(n -> n.get("type").asString()).doesNotContain("TRANSFER");
        assertThat(recent).extracting(n -> n.at("/location/id").asString()).containsOnly(l2.toString());
    }

    @Test
    void managerSeesStockValue() throws Exception {
        Session manager = api.userSession(t.admin(), "MANAGER", List.of());
        assertThat(summary(manager, "").at("/catalogue/stockValue").decimalValue()).isEqualByComparingTo("2020");
    }

    @Test
    void companiesAreIsolated() throws Exception {
        TenantFixture other = api.newTenant("Other");
        JsonNode s = summary(other.admin(), "");
        assertThat(s.at("/catalogue/activeProducts").asLong()).isZero();
        assertThat(s.at("/catalogue/totalQuantity").decimalValue()).isEqualByComparingTo("0");
        assertThat(s.at("/activity/period/entries").asLong()).isZero();
        assertThat(api.getJson("/api/v1/dashboard/recent-activity", other.admin())).isEmpty();

        mvc.perform(get("/api/v1/dashboard/summary?locationId=" + l2).header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidRequestsAreRejected() throws Exception {
        mvc.perform(get("/api/v1/dashboard/summary?period=2W").header("Authorization", t.admin().bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PERIOD"));
        String tomorrow = LocalDate.now(ZoneId.of("Africa/Douala")).plusDays(1).toString();
        mvc.perform(get("/api/v1/dashboard/stock-flow?period=CUSTOM&from=2026-01-01&to=" + tomorrow)
                        .header("Authorization", t.admin().bearer()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/dashboard/recent-activity?type=SALE").header("Authorization", t.admin().bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_FILTER"));
        mvc.perform(get("/api/v1/dashboard/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    void platformDashboardIsForTheSuperAdminOnly() throws Exception {
        Session superAdmin = api.superAdmin();
        JsonNode p = api.getJson("/api/v1/platform/dashboard?period=7D", superAdmin);

        long companies = jdbc.queryForObject("SELECT count(*) FROM companies", Long.class);
        long active = jdbc.queryForObject("SELECT count(*) FROM companies WHERE status = 'ACTIVE'", Long.class);
        assertThat(p.at("/totals/companies").asLong()).isEqualTo(companies);
        assertThat(p.at("/totals/activeCompanies").asLong()).isEqualTo(active);
        assertThat(p.at("/totals/disabledCompanies").asLong()).isEqualTo(companies - active);
        assertThat(p.at("/totals/operationsToday").asLong()).isGreaterThanOrEqualTo(10);
        assertThat(p.get("activity")).hasSize(7);
        long created = 0;
        for (JsonNode point : p.get("activity")) created += point.get("newCompanies").asLong();
        assertThat(created).isGreaterThanOrEqualTo(1);
        assertThat(p.get("recentEvents")).isNotEmpty();
        assertThat(p.get("recentEvents")).extracting(e -> e.get("action").asString())
                .doesNotContain("LOGIN_SUCCEEDED", "LOGIN_FAILED");

        // A company user cannot read the platform; the super admin has no company dashboard.
        mvc.perform(get("/api/v1/platform/dashboard").header("Authorization", t.admin().bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/dashboard/summary").header("Authorization", superAdmin.bearer()))
                .andExpect(status().isForbidden());
    }

    // ----- Helpers -----

    private JsonNode summary(Session session, String query) throws Exception {
        return api.getJson("/api/v1/dashboard/summary?period=30D" + query, session);
    }

    private UUID product(String name, int price, int min, boolean lots) throws Exception {
        return id(api.create("/api/v1/products", t.admin(), Map.of(
                "name", name, "unit", "UNIT", "purchasePrice", price, "minStock", min,
                "batchTracked", lots, "expiryTracked", lots)));
    }

    private Map<String, Object> lot(UUID product, int quantity, String number, LocalDate expiry) {
        return Map.of("productId", product, "quantity", quantity, "batchNumber", number,
                "expirationDate", expiry.toString());
    }

    private void entry(UUID location, UUID product, int quantity) throws Exception {
        entry(location, Map.of("productId", product, "quantity", quantity));
    }

    private void entry(UUID location, Map<String, Object> line) throws Exception {
        api.create("/api/v1/stock/entries", t.admin(), Map.of("locationId", location, "lines", List.of(line)));
    }

    private void exit(UUID location, UUID product, int quantity) throws Exception {
        api.create("/api/v1/stock/exits", t.admin(), Map.of(
                "locationId", location, "lines", List.of(Map.of("productId", product, "quantity", quantity))));
    }

    private static UUID id(JsonNode node) {
        return UUID.fromString(node.get("id").asString());
    }
}
