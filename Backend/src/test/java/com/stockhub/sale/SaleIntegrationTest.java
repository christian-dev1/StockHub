package com.stockhub.sale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Point-of-sale sales through the real API, with the VENDEUR role as the main actor. */
class SaleIntegrationTest extends AbstractIntegrationTest {
    @Autowired JdbcTemplate jdbc;

    TenantFixture t;
    String store;
    String warehouse;
    String water;
    String rice;
    Session seller;
    Session otherSeller;

    @BeforeEach
    void setup() throws Exception {
        t = api.newTenant("Sale");
        store = t.primaryLocationId().toString();
        warehouse =
                api.create(
                                "/api/v1/locations",
                                t.admin(),
                                Map.of("name", "Depot", "code", "DEP", "type", "WAREHOUSE"))
                        .get("id")
                        .asString();
        water = product("Eau 1,5 L", "EAU-15", "3017620422003", 500, 250);
        rice = product("Riz 5 kg", "RIZ-5", null, 4500, 3000);
        entry(store, water, 20);
        entry(store, rice, 5);
        seller = api.userSession(t.admin(), "VENDEUR", List.of(t.primaryLocationId()));
        otherSeller = api.userSession(t.admin(), "VENDEUR", List.of(t.primaryLocationId()));
    }

    String product(String name, String sku, String barcode, int salePrice, int purchasePrice) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("sku", sku);
        body.put("unit", "UNIT");
        body.put("salePrice", salePrice);
        body.put("purchasePrice", purchasePrice);
        if (barcode != null) body.put("barcode", barcode);
        return api.create("/api/v1/products", t.admin(), body).get("id").asString();
    }

    void entry(String location, String product, int quantity) throws Exception {
        api.create(
                "/api/v1/stock/entries",
                t.admin(),
                Map.of("locationId", location, "lines", List.of(Map.of("productId", product, "quantity", quantity))));
    }

    Map<String, Object> sale(String customer, String payment, Map<?, ?>... lines) {
        Map<String, Object> body = new HashMap<>();
        body.put("locationId", store);
        body.put("paymentMethod", payment);
        body.put("lines", List.of(lines));
        if (customer != null) body.put("customerName", customer);
        return body;
    }

    static Map<String, Object> line(String product, Object quantity) {
        return Map.of("productId", product, "quantity", quantity);
    }

    BigDecimal balance(String location, String product) {
        return jdbc.queryForObject(
                "SELECT quantity FROM stock_levels WHERE company_id=? AND location_id=? AND product_id=?",
                BigDecimal.class,
                t.companyId(),
                UUID.fromString(location),
                UUID.fromString(product));
    }

    int salesCount() {
        return jdbc.queryForObject("SELECT count(*) FROM sales WHERE company_id=?", Integer.class, t.companyId());
    }

    @Test
    void sellerRecordsASaleWithoutCustomerNameAndStockIsIssued() throws Exception {
        JsonNode sale = api.create("/api/v1/sales", seller, sale(null, "CASH", line(water, 3)));

        int year = LocalDate.now(ZoneId.of("Africa/Douala")).getYear();
        assertThat(sale.get("number").asString()).isEqualTo("VT-" + year + "-000001");
        assertThat(sale.get("status").asString()).isEqualTo("COMPLETED");
        // Null fields are omitted from API responses.
        assertThat(sale.has("customerName")).isFalse();
        assertThat(sale.get("paymentMethod").asString()).isEqualTo("CASH");
        assertThat(sale.get("currency").asString()).isEqualTo("XAF");
        assertThat(sale.get("sellerName").asString()).isEqualTo("Test VENDEUR");
        assertThat(sale.get("locationName").asString()).isNotBlank();
        assertThat(new BigDecimal(sale.get("totalAmount").asString())).isEqualByComparingTo("1500");
        assertThat(sale.get("createdAt").asString()).isNotBlank();
        assertThat(balance(store, water)).isEqualByComparingTo("17");

        String movementType =
                jdbc.queryForObject(
                        "SELECT m.type FROM stock_movements m JOIN stock_documents d ON d.id = m.document_id"
                                + " WHERE d.company_id=? AND d.reference=?",
                        String.class,
                        t.companyId(),
                        sale.get("number").asString());
        assertThat(movementType).isEqualTo("SALE");
        assertThat(sale.get("stockDocumentNumber").asString()).startsWith("BS-");
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM audit_logs WHERE company_id=? AND action='SALE_CREATED'",
                                Integer.class,
                                t.companyId()))
                .isEqualTo(1);
    }

    @Test
    void customerNameIsStoredTrimmedAndSearchable() throws Exception {
        JsonNode sale = api.create("/api/v1/sales", seller, sale("  Mme Ngo  ", "MOBILE_MONEY", line(water, 1)));
        assertThat(sale.get("customerName").asString()).isEqualTo("Mme Ngo");

        JsonNode detail = api.getJson("/api/v1/sales/" + sale.get("id").asString(), seller);
        assertThat(detail.get("customerName").asString()).isEqualTo("Mme Ngo");

        JsonNode found = api.getJson("/api/v1/sales?search=ngo", seller);
        assertThat(found.get("totalElements").asLong()).isEqualTo(1);
        JsonNode byNumber = api.getJson("/api/v1/sales?search=" + sale.get("number").asString(), seller);
        assertThat(byNumber.get("totalElements").asLong()).isEqualTo(1);

        mvc.perform(api.jsonPost("/api/v1/sales", seller, sale("x".repeat(121), "CASH", line(water, 1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FIELD_TOO_LONG"));
    }

    @Test
    void severalProductsArePricedByTheServerOnly() throws Exception {
        Map<String, Object> cheat = new HashMap<>(line(water, 2));
        cheat.put("unitPrice", 1);
        Map<String, Object> body = sale(null, "CARD", cheat, line(rice, 1));
        body.put("totalAmount", 1);
        JsonNode sale = api.create("/api/v1/sales", seller, body);

        assertThat(new BigDecimal(sale.get("totalAmount").asString())).isEqualByComparingTo("5500");
        JsonNode lines = sale.get("lines");
        assertThat(lines.size()).isEqualTo(2);
        assertThat(lines.get(0).get("position").asInt()).isEqualTo(1);
        assertThat(new BigDecimal(lines.get(0).get("unitPrice").asString())).isEqualByComparingTo("500");
        assertThat(new BigDecimal(lines.get(0).get("lineTotal").asString())).isEqualByComparingTo("1000");
        assertThat(new BigDecimal(lines.get(1).get("lineTotal").asString())).isEqualByComparingTo("4500");
        assertThat(balance(store, water)).isEqualByComparingTo("18");
        assertThat(balance(store, rice)).isEqualByComparingTo("4");
    }

    @Test
    void invalidCartsAreRejectedWithoutAnyEffect() throws Exception {
        expectError(sale(null, "CASH"), 400, "SALE_EMPTY");
        expectError(sale(null, "CASH", line(water, 0)), 400, "QUANTITY_INVALID");
        expectError(sale(null, "CASH", line(water, -2)), 400, "QUANTITY_INVALID");
        expectError(sale(null, "CASH", line(water, 1.5)), 400, "QUANTITY_MUST_BE_WHOLE");
        expectError(sale(null, "CASH", line(water, 1), line(water, 2)), 400, "SALE_DUPLICATE_PRODUCT");
        expectError(sale(null, "BITCOIN", line(water, 1)), 400, "SALE_PAYMENT_METHOD_INVALID");
        expectError(sale(null, null, line(water, 1)), 400, "SALE_PAYMENT_METHOD_INVALID");
        Map<String, Object> noLocation = sale(null, "CASH", line(water, 1));
        noLocation.remove("locationId");
        expectError(noLocation, 400, "LOCATION_REQUIRED");
        mvc.perform(api.jsonPost("/api/v1/sales", seller, sale(null, "CASH", line(UUID.randomUUID().toString(), 1))))
                .andExpect(status().isNotFound());

        assertThat(salesCount()).isZero();
        assertThat(balance(store, water)).isEqualByComparingTo("20");
    }

    @Test
    void insufficientStockRollsBackTheWholeSale() throws Exception {
        expectError(sale(null, "CASH", line(water, 2), line(rice, 6)), 422, "INSUFFICIENT_STOCK");
        assertThat(salesCount()).isZero();
        assertThat(balance(store, water)).isEqualByComparingTo("20");
        assertThat(balance(store, rice)).isEqualByComparingTo("5");

        // The company setting is the only way to sell below zero.
        jdbc.update("UPDATE companies SET allow_negative_stock=true WHERE id=?", t.companyId());
        api.create("/api/v1/sales", seller, sale(null, "CASH", line(rice, 6)));
        assertThat(balance(store, rice)).isEqualByComparingTo("-1");
    }

    @Test
    void inactiveProductsAndForeignLocationsCannotBeSold() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/products/" + rice + "/deactivate", t.admin(), Map.of()))
                .andExpect(status().is2xxSuccessful());
        expectError(sale(null, "CASH", line(rice, 1)), 422, "PRODUCT_INACTIVE");

        Map<String, Object> elsewhere = sale(null, "CASH", line(water, 1));
        elsewhere.put("locationId", warehouse);
        expectError(elsewhere, 403, "LOCATION_ACCESS_DENIED");
        assertThat(salesCount()).isZero();
    }

    @Test
    void aRetriedSubmissionWithTheSameKeyRecordsOneSale() throws Exception {
        String key = UUID.randomUUID().toString();
        JsonNode first = api.read(mvc.perform(withKey(sale(null, "CASH", line(water, 2)), key, seller))
                .andExpect(status().isCreated()).andReturn());
        JsonNode second = api.read(mvc.perform(withKey(sale(null, "CASH", line(water, 2)), key, seller))
                .andExpect(status().isCreated()).andReturn());

        assertThat(second.get("id").asString()).isEqualTo(first.get("id").asString());
        assertThat(salesCount()).isEqualTo(1);
        assertThat(balance(store, water)).isEqualByComparingTo("18");

        mvc.perform(withKey(sale(null, "CASH", line(water, 2)), key, otherSeller))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("IDEMPOTENCY_KEY_REUSED"));
        mvc.perform(withKey(sale(null, "CASH", line(water, 2)), "bad key!", seller))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("IDEMPOTENCY_KEY_INVALID"));
    }

    @Test
    void aSellerOnlyEverSeesHisOwnSales() throws Exception {
        JsonNode mine = api.create("/api/v1/sales", seller, sale("Client A", "CASH", line(water, 1)));
        JsonNode theirs = api.create("/api/v1/sales", otherSeller, sale("Client B", "CARD", line(water, 1)));
        JsonNode admins = api.create("/api/v1/sales", t.admin(), sale(null, "CASH", line(rice, 1)));

        for (String query : List.of("", "?mine=false", "?mine=true", "?size=100")) {
            JsonNode page = api.getJson("/api/v1/sales" + query, seller);
            assertThat(page.get("totalElements").asLong()).isEqualTo(1);
            assertThat(page.at("/content/0/id").asString()).isEqualTo(mine.get("id").asString());
        }
        mvc.perform(get("/api/v1/sales/" + theirs.get("id").asString()).header("Authorization", seller.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/sales/" + admins.get("id").asString()).header("Authorization", seller.bearer()))
                .andExpect(status().isNotFound());

        // The admin (all locations) sees every sale of the company, or only his own when asked.
        assertThat(api.getJson("/api/v1/sales", t.admin()).get("totalElements").asLong()).isEqualTo(3);
        assertThat(api.getJson("/api/v1/sales?mine=true", t.admin()).get("totalElements").asLong()).isEqualTo(1);
        api.getJson("/api/v1/sales/" + mine.get("id").asString(), t.admin());

        // Another company never sees them.
        TenantFixture other = api.newTenant("Other");
        assertThat(api.getJson("/api/v1/sales", other.admin()).get("totalElements").asLong()).isZero();
        mvc.perform(get("/api/v1/sales/" + mine.get("id").asString()).header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void mySalesCanBeFilteredByDatePaymentAndStatus() throws Exception {
        api.create("/api/v1/sales", seller, sale(null, "CASH", line(water, 1)));
        api.create("/api/v1/sales", seller, sale(null, "MOBILE_MONEY", line(water, 1)));
        String today = LocalDate.now(ZoneId.of("Africa/Douala")).toString();
        String yesterday = LocalDate.now(ZoneId.of("Africa/Douala")).minusDays(1).toString();

        assertThat(api.getJson("/api/v1/sales?paymentMethod=CASH", seller).get("totalElements").asLong()).isEqualTo(1);
        assertThat(api.getJson("/api/v1/sales?status=COMPLETED", seller).get("totalElements").asLong()).isEqualTo(2);
        assertThat(api.getJson("/api/v1/sales?from=" + today + "&to=" + today, seller).get("totalElements").asLong())
                .isEqualTo(2);
        assertThat(api.getJson("/api/v1/sales?to=" + yesterday, seller).get("totalElements").asLong()).isZero();
        mvc.perform(get("/api/v1/sales?from=" + today + "&to=" + yesterday).header("Authorization", seller.bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("DATE_RANGE_INVALID"));
        mvc.perform(get("/api/v1/sales?paymentMethod=GOLD").header("Authorization", seller.bearer()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void theSellerSummaryOnlyCountsHisOwnSales() throws Exception {
        api.create("/api/v1/sales", seller, sale(null, "CASH", line(water, 2), line(rice, 1)));
        api.create("/api/v1/sales", seller, sale(null, "CASH", line(water, 4)));
        api.create("/api/v1/sales", otherSeller, sale(null, "CASH", line(rice, 3)));

        JsonNode summary = api.getJson("/api/v1/sales/me/summary", seller);
        assertThat(summary.get("currency").asString()).isEqualTo("XAF");
        assertThat(summary.at("/today/salesCount").asLong()).isEqualTo(2);
        assertThat(new BigDecimal(summary.at("/today/revenue").asString())).isEqualByComparingTo("7500");
        assertThat(new BigDecimal(summary.at("/today/averageBasket").asString())).isEqualByComparingTo("3750");
        assertThat(summary.at("/lastDays/salesCount").asLong()).isEqualTo(2);
        assertThat(summary.at("/topProducts/0/productId").asString()).isEqualTo(water);
        assertThat(new BigDecimal(summary.at("/topProducts/0/quantity").asString())).isEqualByComparingTo("6");
        assertThat(summary.get("topProducts").size()).isEqualTo(2);
        assertThat(summary.get("recentSales").size()).isEqualTo(2);

        JsonNode empty = api.getJson("/api/v1/sales/me/summary", t.admin());
        assertThat(empty.at("/today/salesCount").asLong()).isZero();
        assertThat(new BigDecimal(empty.at("/today/averageBasket").asString())).isEqualByComparingTo("0");
        mvc.perform(get("/api/v1/sales/me/summary?days=0").header("Authorization", seller.bearer()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void theCatalogueShowsSalePriceAndAvailabilityButNoPurchasePrice() throws Exception {
        JsonNode page = api.getJson("/api/v1/sales/catalogue?locationId=" + store, seller);
        assertThat(page.get("totalElements").asLong()).isEqualTo(2);
        JsonNode first = page.at("/content/0");
        assertThat(first.get("name").asString()).isEqualTo("Eau 1,5 L");
        assertThat(new BigDecimal(first.get("salePrice").asString())).isEqualByComparingTo("500");
        assertThat(new BigDecimal(first.get("availableQuantity").asString())).isEqualByComparingTo("20");
        assertThat(first.has("purchasePrice")).isFalse();

        JsonNode byBarcode = api.getJson("/api/v1/sales/catalogue?locationId=" + store + "&search=3017620422003", seller);
        assertThat(byBarcode.get("totalElements").asLong()).isEqualTo(1);
        JsonNode bySku = api.getJson("/api/v1/sales/catalogue?locationId=" + store + "&search=riz-5", seller);
        assertThat(bySku.at("/content/0/id").asString()).isEqualTo(rice);
        JsonNode wildcard = api.getJson("/api/v1/sales/catalogue?locationId=" + store + "&search=%25", seller);
        assertThat(wildcard.get("totalElements").asLong()).isZero();

        api.create("/api/v1/sales", seller, sale(null, "CASH", line(rice, 5)));
        JsonNode inStock = api.getJson("/api/v1/sales/catalogue?locationId=" + store + "&inStock=true", seller);
        assertThat(inStock.get("totalElements").asLong()).isEqualTo(1);
        JsonNode detail = api.getJson("/api/v1/sales/catalogue/" + rice + "?locationId=" + store, seller);
        assertThat(new BigDecimal(detail.get("availableQuantity").asString())).isEqualByComparingTo("0");

        mvc.perform(get("/api/v1/sales/catalogue?locationId=" + warehouse).header("Authorization", seller.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LOCATION_ACCESS_DENIED"));
        mvc.perform(get("/api/v1/sales/catalogue?locationId=" + UUID.randomUUID()).header("Authorization", seller.bearer()))
                .andExpect(status().isNotFound());

        JsonNode settings = api.getJson("/api/v1/sales/settings", seller);
        assertThat(settings.get("currency").asString()).isEqualTo("XAF");
        assertThat(settings.get("allowNegativeStock").asBoolean()).isFalse();
        assertThat(settings.get("paymentMethods").size()).isEqualTo(5);
    }

    @Test
    void theSellerHasNoAdministrativeAccess() throws Exception {
        String product = "/api/v1/products/" + water;
        List<MockHttpServletRequestBuilder> forbidden =
                List.of(
                        api.jsonPost("/api/v1/products", seller, Map.of("name", "X", "unit", "UNIT")),
                        api.jsonPut(product, seller, Map.of("version", 0, "product", Map.of("name", "X", "unit", "UNIT"))),
                        delete(product).header("Authorization", seller.bearer()),
                        api.jsonPost(product + "/deactivate", seller, Map.of()),
                        api.jsonPost("/api/v1/categories", seller, Map.of("name", "X")),
                        api.jsonPost("/api/v1/stock/entries", seller, Map.of()),
                        api.jsonPost("/api/v1/stock/exits", seller, Map.of()),
                        api.jsonPost("/api/v1/stock/adjustments", seller, Map.of()),
                        api.jsonPost("/api/v1/stock/transfers", seller, Map.of()),
                        get("/api/v1/batches").header("Authorization", seller.bearer()),
                        get("/api/v1/users").header("Authorization", seller.bearer()),
                        api.jsonPost("/api/v1/users", seller, Map.of()),
                        get("/api/v1/roles").header("Authorization", seller.bearer()),
                        api.jsonPost("/api/v1/locations", seller, Map.of("name", "X", "code", "X", "type", "STORE")),
                        get("/api/v1/company").header("Authorization", seller.bearer()),
                        api.jsonPut("/api/v1/company/settings", seller, Map.of()),
                        get("/api/v1/suppliers").header("Authorization", seller.bearer()),
                        get("/api/v1/products/imports/template").header("Authorization", seller.bearer()),
                        get("/api/v1/platform/companies").header("Authorization", seller.bearer()),
                        get("/api/v1/platform/dashboard").header("Authorization", seller.bearer()));
        for (var request : forbidden) {
            mvc.perform(request).andExpect(status().isForbidden());
        }
        assertThat(balance(store, water)).isEqualByComparingTo("20");

        // Sales cannot be modified nor deleted through the API.
        JsonNode sale = api.create("/api/v1/sales", seller, sale(null, "CASH", line(water, 1)));
        String url = "/api/v1/sales/" + sale.get("id").asString();
        mvc.perform(delete(url).header("Authorization", seller.bearer()))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(403, 404, 405));
        mvc.perform(put(url).header("Authorization", seller.bearer()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(403, 404, 405));
        mvc.perform(post(url + "/cancel").header("Authorization", seller.bearer()))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(403, 404, 405));
        assertThatThrownBy(() -> jdbc.update("UPDATE sales SET total_amount=0 WHERE company_id=?", t.companyId()))
                .isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(() -> jdbc.update("DELETE FROM sales WHERE company_id=?", t.companyId()))
                .isInstanceOf(org.springframework.dao.DataAccessException.class);
    }

    @Test
    void rolesWithoutSalePermissionsCannotSell() throws Exception {
        Session storekeeper = api.userSession(t.admin(), "MAGASINIER", List.of(t.primaryLocationId()));
        mvc.perform(api.jsonPost("/api/v1/sales", storekeeper, sale(null, "CASH", line(water, 1))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/sales").header("Authorization", storekeeper.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/sales/settings").header("Authorization", storekeeper.bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/sales")).andExpect(status().isUnauthorized());
        assertThat(salesCount()).isZero();
    }

    private void expectError(Map<String, Object> body, int status, String code) throws Exception {
        mvc.perform(api.jsonPost("/api/v1/sales", seller, body))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.code").value(code));
    }

    private MockHttpServletRequestBuilder withKey(Map<String, Object> body, String key, Session session) {
        return api.jsonPost("/api/v1/sales", session, body).header("Idempotency-Key", key);
    }
}
