package com.stockhub.stock;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.stockhub.support.*;
import com.stockhub.support.ApiFixtures.*;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

class StockIntegrationTest extends AbstractIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    TenantFixture t;
    String product;
    String a;
    String b;

    @BeforeEach
    void setup() throws Exception {
        t = api.newTenant("Stock");
        a = t.primaryLocationId().toString();
        b =
                api.create(
                                "/api/v1/locations",
                                t.admin(),
                                Map.of("name", "B", "code", "B", "type", "WAREHOUSE"))
                        .get("id")
                        .asString();
        product = createProduct(false);
    }

    String createProduct(boolean batches) throws Exception {
        return api.create(
                        "/api/v1/products",
                        t.admin(),
                        Map.of(
                                "name",
                                "Product",
                                "unit",
                                "UNIT",
                                "batchTracked",
                                batches,
                                "expiryTracked",
                                batches,
                                "minStock",
                                3))
                .get("id")
                .asString();
    }

    Map<String, Object> line(int q) {
        return Map.of("productId", product, "quantity", q);
    }

    JsonNode entry(String location, int q) throws Exception {
        return api.create(
                "/api/v1/stock/entries",
                t.admin(),
                Map.of("locationId", location, "lines", List.of(line(q))));
    }

    JsonNode exit(String location, int q) throws Exception {
        return api.create(
                "/api/v1/stock/exits",
                t.admin(),
                Map.of("locationId", location, "lines", List.of(line(q))));
    }

    BigDecimal balance(String location) {
        return jdbc.queryForObject(
                "SELECT quantity FROM stock_levels WHERE company_id=? AND location_id=? AND"
                        + " product_id=?",
                BigDecimal.class,
                t.companyId(),
                UUID.fromString(location),
                UUID.fromString(product));
    }

    Object transfer(int q) {
        return Map.of("sourceLocationId", a, "destinationLocationId", b, "lines", List.of(line(q)));
    }

    @Test
    void finalScenarioAndNegativeSetting() throws Exception {
        var d = entry(a, 20);
        assertThat(d.get("number").asString()).matches("BE-\\d{4}-000001");
        api.create("/api/v1/stock/transfers", t.admin(), transfer(7));
        exit(b, 2);
        assertThat(balance(a)).isEqualByComparingTo("13");
        assertThat(balance(b)).isEqualByComparingTo("5");
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/exits",
                                t.admin(),
                                Map.of("locationId", a, "lines", List.of(line(20)))))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_STOCK"));
        assertThat(balance(a)).isEqualByComparingTo("13");
        jdbc.update("UPDATE companies SET allow_negative_stock=true WHERE id=?", t.companyId());
        exit(a, 15);
        assertThat(balance(a)).isEqualByComparingTo("-2");
    }

    @Test
    void documentsAuditAndImmutability() throws Exception {
        var d = entry(a, 20);
        var doc = api.getJson("/api/v1/stock-documents/" + d.get("id").asString(), t.admin());
        assertThat(doc.get("lines").size()).isEqualTo(1);
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM audit_logs WHERE company_id=? AND"
                                        + " action='STOCK_ENTRY'",
                                Integer.class,
                                t.companyId()))
                .isEqualTo(1);
        for (String sql :
                List.of(
                        "UPDATE stock_movements SET quantity=99 WHERE company_id=?",
                        "DELETE FROM stock_movements WHERE company_id=?"))
            assertThatThrownBy(() -> jdbc.update(sql, t.companyId()))
                    .isInstanceOf(org.springframework.dao.DataAccessException.class);
    }

    @Test
    void adjustmentAndGuards() throws Exception {
        entry(a, 20);
        entry(b, 1);
        api.create(
                "/api/v1/stock/adjustments",
                t.admin(),
                Map.of(
                        "locationId",
                        a,
                        "productId",
                        product,
                        "countedQuantity",
                        12,
                        "reason",
                        "Count"));
        assertThat(balance(a)).isEqualByComparingTo("12");
        mvc.perform(
                        delete("/api/v1/products/" + product)
                                .header("Authorization", t.admin().bearer()))
                .andExpect(status().isUnprocessableContent());
        mvc.perform(api.jsonPost("/api/v1/locations/" + b + "/deactivate", t.admin(), Map.of()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("LOCATION_HAS_STOCK"));
    }

    @Test
    void transferRollbackOnSecondLeg() throws Exception {
        entry(a, 20);
        entry(b, 5);
        jdbc.execute(
                "CREATE FUNCTION stock_test_fail_"
                        + t.companyId().toString().replace("-", "")
                        + "() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.location_id='"
                        + b
                        + "'::uuid THEN RAISE EXCEPTION 'injected second leg failure'; END IF;"
                        + " RETURN NEW; END $$");
        String name = "stock_test_fail_" + t.companyId().toString().replace("-", "");
        jdbc.execute(
                "CREATE TRIGGER "
                        + name
                        + " BEFORE UPDATE ON stock_levels FOR EACH ROW EXECUTE FUNCTION "
                        + name
                        + "()");
        try {
            mvc.perform(api.jsonPost("/api/v1/stock/transfers", t.admin(), transfer(7)))
                    .andExpect(status().is5xxServerError());
        } finally {
            jdbc.execute("DROP TRIGGER " + name + " ON stock_levels");
            jdbc.execute("DROP FUNCTION " + name + "()");
        }
        assertThat(balance(a)).isEqualByComparingTo("20");
        assertThat(balance(b)).isEqualByComparingTo("5");
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM stock_documents WHERE company_id=? AND"
                                        + " type='TRANSFER'",
                                Integer.class,
                                t.companyId()))
                .isZero();
    }

    @Test
    void sameLocationRejected() throws Exception {
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/transfers",
                                t.admin(),
                                Map.of(
                                        "sourceLocationId",
                                        a,
                                        "destinationLocationId",
                                        a,
                                        "lines",
                                        List.of(line(1)))))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("INVALID_TRANSFER"));
    }

    void batchEntry(String number, int quantity, int days) throws Exception {
        api.create(
                "/api/v1/stock/entries",
                t.admin(),
                Map.of(
                        "locationId",
                        a,
                        "lines",
                        List.of(
                                Map.of(
                                        "productId",
                                        product,
                                        "quantity",
                                        quantity,
                                        "batchNumber",
                                        number,
                                        "manufacturingDate",
                                        LocalDate.now().minusDays(20).toString(),
                                        "expirationDate",
                                        LocalDate.now().plusDays(days).toString()))));
    }

    @Test
    void fefoMultiBatchTransferAndExpiredRejection() throws Exception {
        product = createProduct(true);
        batchEntry("A", 3, 10);
        batchEntry("B", 5, 20);
        batchEntry("C", 10, 40);
        batchEntry("OLD", 9, -1);
        var d = exit(a, 7);
        assertThat(
                        api.getJson("/api/v1/stock-documents/" + d.get("id").asString(), t.admin())
                                .get("lines")
                                .size())
                .isEqualTo(2);
        assertThat(
                        jdbc.queryForList(
                                "SELECT quantity FROM batches WHERE company_id=? ORDER BY"
                                        + " batch_number",
                                BigDecimal.class,
                                t.companyId()))
                .containsExactly(
                        new BigDecimal("0.000"),
                        new BigDecimal("1.000"),
                        new BigDecimal("10.000"),
                        new BigDecimal("9.000"));
        api.create("/api/v1/stock/transfers", t.admin(), transfer(4));
        assertThat(balance(b)).isEqualByComparingTo("4");
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM batches x JOIN batches y ON"
                                        + " x.batch_number=y.batch_number AND"
                                        + " x.expiration_date=y.expiration_date AND"
                                        + " x.manufacturing_date=y.manufacturing_date WHERE"
                                        + " x.company_id=? AND x.location_id=? AND y.location_id=?",
                                Integer.class,
                                t.companyId(),
                                UUID.fromString(a),
                                UUID.fromString(b)))
                .isEqualTo(2);
        String expired =
                jdbc.queryForObject(
                                "SELECT id FROM batches WHERE company_id=? AND batch_number='OLD'",
                                UUID.class,
                                t.companyId())
                        .toString();
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/exits",
                                t.admin(),
                                Map.of(
                                        "locationId",
                                        a,
                                        "lines",
                                        List.of(
                                                Map.of(
                                                        "productId",
                                                        product,
                                                        "quantity",
                                                        1,
                                                        "batchId",
                                                        expired)))))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BATCH_EXPIRED"));
    }

    List<Integer> concurrent(String first, String second) throws Exception {
        var start = new CountDownLatch(1);
        var ready = new CountDownLatch(2);
        try (var pool = Executors.newFixedThreadPool(2)) {
            List<Future<Integer>> futures = new ArrayList<>();
            for (String action : List.of(first, second))
                futures.add(
                        pool.submit(
                                () -> {
                                    ready.countDown();
                                    if (!start.await(10, TimeUnit.SECONDS))
                                        throw new IllegalStateException("barrier");
                                    return mvc.perform(
                                                    api.jsonPost(
                                                            "/api/v1/stock/" + action,
                                                            t.admin(),
                                                            action.equals("transfers")
                                                                    ? transfer(1)
                                                                    : Map.of(
                                                                            "locationId",
                                                                            a,
                                                                            "lines",
                                                                            List.of(line(1)))))
                                            .andReturn()
                                            .getResponse()
                                            .getStatus();
                                }));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            return List.of(
                    futures.get(0).get(30, TimeUnit.SECONDS),
                    futures.get(1).get(30, TimeUnit.SECONDS));
        }
    }

    @Test
    void concurrentExits() throws Exception {
        entry(a, 1);
        assertThat(concurrent("exits", "exits")).containsExactlyInAnyOrder(201, 422);
        assertThat(balance(a)).isEqualByComparingTo("0");
    }

    @Test
    void concurrentEntries() throws Exception {
        assertThat(concurrent("entries", "entries")).containsOnly(201);
        assertThat(balance(a)).isEqualByComparingTo("2");
    }

    @Test
    void concurrentEntryExit() throws Exception {
        entry(a, 1);
        assertThat(concurrent("entries", "exits")).containsOnly(201);
        assertThat(balance(a)).isEqualByComparingTo("1");
    }

    @Test
    void concurrentTransfers() throws Exception {
        entry(a, 1);
        assertThat(concurrent("transfers", "transfers")).containsExactlyInAnyOrder(201, 422);
        assertThat(balance(a)).isEqualByComparingTo("0");
        assertThat(balance(b)).isEqualByComparingTo("1");
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.CsvSource({
        "ADMIN,true,true",
        "MANAGER,true,true",
        "MAGASINIER,true,false",
        "VENDEUR,false,false"
    })
    void permissions(String role, boolean writes, boolean adjust) throws Exception {
        entry(a, 10);
        Session user =
                role.equals("ADMIN")
                        ? t.admin()
                        : api.userSession(
                                t.admin(), role, List.of(UUID.fromString(a), UUID.fromString(b)));
        mvc.perform(get("/api/v1/stocks").header("Authorization", user.bearer()))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/batches").header("Authorization", user.bearer()))
                .andExpect(status().is(writes ? 200 : 403));
        for (String path : List.of("entries", "exits"))
            mvc.perform(
                            api.jsonPost(
                                    "/api/v1/stock/" + path,
                                    user,
                                    Map.of("locationId", a, "lines", List.of(line(1)))))
                    .andExpect(status().is(writes ? 201 : 403));
        mvc.perform(api.jsonPost("/api/v1/stock/transfers", user, transfer(1)))
                .andExpect(status().is(writes ? 201 : 403));
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/adjustments",
                                user,
                                Map.of(
                                        "locationId",
                                        a,
                                        "productId",
                                        product,
                                        "countedQuantity",
                                        7,
                                        "reason",
                                        "Count")))
                .andExpect(status().is(adjust ? 201 : 403));
    }

    @Test
    void companyIsolationForEveryResourceAndOperation() throws Exception {
        product = createProduct(true);
        batchEntry("A", 10, 10);
        var other = api.newTenant("OtherStock");
        for (String kind : List.of("stocks", "stock-movements", "batches", "stock-documents")) {
            var ours = api.getJson("/api/v1/" + kind, t.admin()).get("content");
            assertThat(ours.size()).isGreaterThan(0);
            assertThat(api.getJson("/api/v1/" + kind, other.admin()).get("content").size())
                    .isZero();
            String id = kind.equals("stocks") ? product : ours.get(0).get("id").asString();
            mvc.perform(
                            get("/api/v1/" + kind + "/" + id)
                                    .header("Authorization", other.admin().bearer()))
                    .andExpect(status().isNotFound());
        }
        for (String path : List.of("entries", "exits")) {
            mvc.perform(
                            api.jsonPost(
                                    "/api/v1/stock/" + path,
                                    other.admin(),
                                    Map.of("locationId", a, "lines", List.of(line(1)))))
                    .andExpect(status().isNotFound());
            mvc.perform(
                            api.jsonPost(
                                    "/api/v1/stock/" + path,
                                    other.admin(),
                                    Map.of(
                                            "locationId",
                                            other.primaryLocationId(),
                                            "lines",
                                            List.of(line(1)))))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/adjustments",
                                other.admin(),
                                Map.of(
                                        "locationId",
                                        a,
                                        "productId",
                                        product,
                                        "countedQuantity",
                                        7,
                                        "reason",
                                        "Count")))
                .andExpect(status().isNotFound());
        mvc.perform(api.jsonPost("/api/v1/stock/transfers", other.admin(), transfer(1)))
                .andExpect(status().isNotFound());
        assertThat(balance(a)).isEqualByComparingTo("10");
    }

    @Test
    void locationScopeAppliesToReadsWritesAndBothTransferSides() throws Exception {
        product = createProduct(true);
        batchEntry("A", 10, 10);
        Session user = api.userSession(t.admin(), "MANAGER", List.of(UUID.fromString(b)));
        for (String kind : List.of("stocks", "stock-movements", "batches", "stock-documents"))
            assertThat(
                            api.getJson("/api/v1/" + kind + "?locationId=" + a, user)
                                    .get("content")
                                    .size())
                    .isZero();
        for (String path : List.of("entries", "exits"))
            mvc.perform(
                            api.jsonPost(
                                    "/api/v1/stock/" + path,
                                    user,
                                    Map.of("locationId", a, "lines", List.of(line(1)))))
                    .andExpect(status().isForbidden());
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/adjustments",
                                user,
                                Map.of(
                                        "locationId",
                                        a,
                                        "productId",
                                        product,
                                        "countedQuantity",
                                        7,
                                        "reason",
                                        "Count")))
                .andExpect(status().isForbidden());
        mvc.perform(api.jsonPost("/api/v1/stock/transfers", user, transfer(1)))
                .andExpect(status().isForbidden());
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/transfers",
                                user,
                                Map.of(
                                        "sourceLocationId",
                                        b,
                                        "destinationLocationId",
                                        a,
                                        "lines",
                                        List.of(line(1)))))
                .andExpect(status().isForbidden());
    }

    @Test
    void batchRequiredAndFilters() throws Exception {
        product = createProduct(true);
        mvc.perform(
                        api.jsonPost(
                                "/api/v1/stock/entries",
                                t.admin(),
                                Map.of("locationId", a, "lines", List.of(line(1)))))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BATCH_REQUIRED"));
        batchEntry("SOON", 2, 20);
        batchEntry("OLD", 1, -1);
        assertThat(
                        api.getJson("/api/v1/batches?status=EXPIRING_SOON", t.admin())
                                .get("content")
                                .size())
                .isEqualTo(1);
        assertThat(api.getJson("/api/v1/batches?status=EXPIRED", t.admin()).get("content").size())
                .isEqualTo(1);
        assertThat(
                        api.getJson("/api/v1/stocks?lowStock=true&search=Product", t.admin())
                                .get("content")
                                .size())
                .isEqualTo(1);
        assertThat(api.getJson("/api/v1/stocks?outOfStock=true", t.admin()).get("content").size())
                .isZero();
    }

    @Test
    void productTrackingCannotChangeWhileStockExists() throws Exception {
        entry(a, 1);
        var current = api.getJson("/api/v1/products/" + product, t.admin());
        mvc.perform(
                        api.jsonPut(
                                "/api/v1/products/" + product,
                                t.admin(),
                                Map.of(
                                        "version",
                                        current.get("version").asLong(),
                                        "product",
                                        Map.of(
                                                "name",
                                                "Product",
                                                "unit",
                                                "UNIT",
                                                "batchTracked",
                                                true))))
                .andExpect(status().isUnprocessableContent());
        assertThat(
                        api.getJson("/api/v1/products/" + product, t.admin())
                                .get("batchTracked")
                                .asBoolean())
                .isFalse();
    }

    @Test
    void openApiDescribesStock() throws Exception {
        var spec = api.getJson("/v3/api-docs", t.admin());
        for (String path :
                List.of(
                        "/api/v1/stocks",
                        "/api/v1/stocks/{id}",
                        "/api/v1/stock/entries",
                        "/api/v1/stock/exits",
                        "/api/v1/stock/adjustments",
                        "/api/v1/stock/transfers",
                        "/api/v1/batches",
                        "/api/v1/batches/{id}",
                        "/api/v1/stock-movements",
                        "/api/v1/stock-documents"))
            assertThat(spec.get("paths").has(path)).isTrue();
    }

    @Test
    void transferTwentyAndFiveProducesThirteenAndTwelve() throws Exception {
        entry(a, 20);
        entry(b, 5);
        var document = api.create("/api/v1/stock/transfers", t.admin(), transfer(7));
        assertThat(balance(a)).isEqualByComparingTo("13");
        assertThat(balance(b)).isEqualByComparingTo("12");
        var movements =
                api.getJson("/api/v1/stock-documents/" + document.get("id").asString(), t.admin())
                        .get("lines");
        assertThat(movements.size()).isEqualTo(2);
        assertThat(movements.get(0).get("reference").asString())
                .isEqualTo(movements.get(1).get("reference").asString());
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM audit_logs WHERE company_id=? AND"
                                    + " action='STOCK_TRANSFER'",
                                Integer.class,
                                t.companyId()))
                .isEqualTo(1);
        assertThat(exit(b, 1).get("number").asString()).matches("BS-\\d{4}-000001");
        assertThat(exit(b, 1).get("number").asString()).matches("BS-\\d{4}-000002");
    }
}
