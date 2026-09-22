package com.stockhub.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * The real catalogue permission matrix, endpoint by endpoint and role by role.
 * Requests carry an empty body or an unknown id, so nothing is written: an
 * allowed role gets 2xx/400/404, a denied role gets 403 (authorization is
 * checked before the body is validated).
 */
class CataloguePermissionMatrixIntegrationTest extends AbstractIntegrationTest {

    private static final Set<String> ALL = Set.of("ADMIN", "MANAGER", "MAGASINIER", "VENDEUR");
    private static final Set<String> ADMIN = Set.of("ADMIN");
    private static final Set<String> CATALOGUE_EDITORS = Set.of("ADMIN", "MANAGER");
    private static final Set<String> STOCK_TEAM = Set.of("ADMIN", "MANAGER", "MAGASINIER");

    /** A fresh request per call: builders are mutable and would pile up Authorization headers. */
    private record Rule(String label, Supplier<AbstractMockHttpServletRequestBuilder<?>> request, Set<String> allowed) {
    }

    @Test
    void everyCatalogueEndpointFollowsTheRoleMatrix() throws Exception {
        TenantFixture tenant = api.newTenant("Matrix");
        List<UUID> none = List.of();
        Map<String, Session> sessions = new LinkedHashMap<>();
        sessions.put("ADMIN", tenant.admin());
        sessions.put("MANAGER", api.userSession(tenant.admin(), "MANAGER", none));
        sessions.put("MAGASINIER", api.userSession(tenant.admin(), "MAGASINIER", none));
        sessions.put("VENDEUR", api.userSession(tenant.admin(), "VENDEUR", none));

        String id = UUID.randomUUID().toString();
        List<Rule> rules = List.of(
                rule("GET locations", () -> get("/api/v1/locations"), ALL),
                rule("GET location", () -> get("/api/v1/locations/" + id), ALL),
                rule("POST location", () -> json(post("/api/v1/locations")), ADMIN),
                rule("PUT location", () -> json(put("/api/v1/locations/" + id)), ADMIN),
                rule("activate location", () -> post("/api/v1/locations/" + id + "/activate"), ADMIN),
                rule("deactivate location", () -> post("/api/v1/locations/" + id + "/deactivate"), ADMIN),
                rule("set primary location", () -> post("/api/v1/locations/" + id + "/set-primary"), ADMIN),

                rule("GET categories", () -> get("/api/v1/categories"), ALL),
                rule("GET category", () -> get("/api/v1/categories/" + id), ALL),
                rule("POST category", () -> json(post("/api/v1/categories")), CATALOGUE_EDITORS),
                rule("PUT category", () -> json(put("/api/v1/categories/" + id)), CATALOGUE_EDITORS),
                rule("DELETE category", () -> delete("/api/v1/categories/" + id), CATALOGUE_EDITORS),

                rule("GET suppliers", () -> get("/api/v1/suppliers"), STOCK_TEAM),
                rule("GET supplier", () -> get("/api/v1/suppliers/" + id), STOCK_TEAM),
                rule("POST supplier", () -> json(post("/api/v1/suppliers")), CATALOGUE_EDITORS),
                rule("PUT supplier", () -> json(put("/api/v1/suppliers/" + id)), CATALOGUE_EDITORS),
                rule("activate supplier", () -> post("/api/v1/suppliers/" + id + "/activate"), CATALOGUE_EDITORS),
                rule("deactivate supplier", () -> post("/api/v1/suppliers/" + id + "/deactivate"), CATALOGUE_EDITORS),

                rule("GET products", () -> get("/api/v1/products"), ALL),
                rule("GET product", () -> get("/api/v1/products/" + id), ALL),
                rule("lookup product", () -> get("/api/v1/products/lookup").param("code", "UNKNOWN"), ALL),
                rule("POST product", () -> json(post("/api/v1/products")), CATALOGUE_EDITORS),
                rule("PUT product", () -> json(put("/api/v1/products/" + id)), CATALOGUE_EDITORS),
                rule("activate product", () -> post("/api/v1/products/" + id + "/activate"), CATALOGUE_EDITORS),
                rule("deactivate product", () -> post("/api/v1/products/" + id + "/deactivate"), CATALOGUE_EDITORS),
                rule("DELETE product", () -> delete("/api/v1/products/" + id), CATALOGUE_EDITORS),

                rule("GET image", () -> get("/api/v1/products/" + id + "/image"), ALL),
                rule("PUT image", () -> multipart(HttpMethod.PUT, "/api/v1/products/" + id + "/image"), CATALOGUE_EDITORS),
                rule("DELETE image", () -> delete("/api/v1/products/" + id + "/image"), CATALOGUE_EDITORS),

                rule("import template", () -> get("/api/v1/products/imports/template"), CATALOGUE_EDITORS),
                rule("import preview", () -> multipart("/api/v1/products/imports/preview"), CATALOGUE_EDITORS),
                rule("import commit", () -> post("/api/v1/products/imports/" + id + "/commit"), CATALOGUE_EDITORS),

                rule("generate barcode", () -> post("/api/v1/products/" + id + "/barcode"), STOCK_TEAM),
                rule("barcode PNG", () -> get("/api/v1/products/" + id + "/barcode.png"), ALL),
                rule("barcode SVG", () -> get("/api/v1/products/" + id + "/barcode.svg"), ALL),
                rule("print labels", () -> json(post("/api/v1/barcodes/labels")), STOCK_TEAM));

        List<String> mismatches = new ArrayList<>();
        for (Rule rule : rules) {
            for (var entry : sessions.entrySet()) {
                var request = rule.request().get().header("Authorization", entry.getValue().bearer());
                int status = mvc.perform(request).andReturn().getResponse().getStatus();
                boolean allowed = rule.allowed().contains(entry.getKey());
                boolean ok = allowed ? status != 401 && status != 403 && status < 500 : status == 403;
                if (!ok) {
                    mismatches.add("%s as %s -> %d (expected %s)".formatted(rule.label(), entry.getKey(), status,
                            allowed ? "allowed" : "403"));
                }
            }
        }
        assertThat(mismatches).isEmpty();
    }

    private static Rule rule(String label, Supplier<AbstractMockHttpServletRequestBuilder<?>> request, Set<String> allowed) {
        return new Rule(label, request, allowed);
    }

    private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request) {
        return request.contentType(MediaType.APPLICATION_JSON).content("{}");
    }
}
