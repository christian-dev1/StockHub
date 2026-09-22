package com.stockhub.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

/**
 * Company B, fully privileged, tries every catalogue operation on the data of
 * company A. Foreign ids must look unknown (404, or the "unknown reference"
 * validation error when used as a reference) and nothing of A may change.
 */
class CatalogueTenantIsolationIntegrationTest extends AbstractIntegrationTest {

    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
    private static final String BARCODE_A = "4006381333931";

    private TenantFixture companyA;
    private Session intruder;
    private String locationA;
    private String categoryA;
    private String supplierA;
    private JsonNode productA;

    @BeforeEach
    void companies() throws Exception {
        companyA = api.newTenant("IsoA");
        intruder = api.newTenant("IsoB").admin();
        Session admin = companyA.admin();
        locationA = api.create("/api/v1/locations", admin,
                Map.of("code", "DEP-A", "name", "Dépôt A", "type", "WAREHOUSE")).get("id").asString();
        categoryA = api.create("/api/v1/categories", admin, Map.of("name", "Boissons A")).get("id").asString();
        supplierA = api.create("/api/v1/suppliers", admin, Map.of("code", "SUPA", "name", "Fournisseur A"))
                .get("id").asString();
        productA = api.create("/api/v1/products", admin, Map.of("sku", "SKU-A", "name", "Produit A", "unit", "UNIT",
                "barcode", BARCODE_A, "categoryId", categoryA, "defaultSupplierId", supplierA));
        mvc.perform(image(HttpMethod.PUT, admin)).andExpect(status().isNoContent());
    }

    @Test
    void foreignLocationsDoNotExist() throws Exception {
        String url = "/api/v1/locations/" + locationA;
        expectNotFound(get(url));
        expectNotFoundSigned(api.jsonPut(url, intruder, Map.of("version", 0,
                "location", Map.of("code", "HACK", "name", "Hack", "type", "STORE"))));
        expectNotFound(post(url + "/deactivate"));
        expectNotFound(post(url + "/activate"));
        expectNotFound(post(url + "/set-primary"));
        assertThat(api.getJson("/api/v1/locations?includeInactive=true", intruder).toString()).doesNotContain(locationA);
    }

    @Test
    void foreignCategoriesDoNotExistNorServeAsParent() throws Exception {
        String url = "/api/v1/categories/" + categoryA;
        expectNotFound(get(url));
        expectNotFoundSigned(api.jsonPut(url, intruder, Map.of("version", 0, "category", Map.of("name", "Hack"))));
        expectNotFound(delete(url));
        mvc.perform(api.jsonPost("/api/v1/categories", intruder, Map.of("name", "Sous", "parentId", categoryA)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CATEGORY_PARENT_UNKNOWN"));
        assertThat(api.getJson("/api/v1/categories", intruder).toString()).doesNotContain(categoryA);
    }

    @Test
    void foreignSuppliersDoNotExist() throws Exception {
        String url = "/api/v1/suppliers/" + supplierA;
        expectNotFound(get(url));
        expectNotFoundSigned(api.jsonPut(url, intruder, Map.of("version", 0, "supplier", Map.of("code", "X", "name", "X"))));
        expectNotFound(post(url + "/deactivate"));
        expectNotFound(post(url + "/activate"));
        assertThat(api.getJson("/api/v1/suppliers?q=SUPA", intruder).get("totalElements").asLong()).isZero();
    }

    @Test
    void foreignProductsDoNotExist() throws Exception {
        String url = "/api/v1/products/" + productA.get("id").asString();
        expectNotFound(get(url));
        expectNotFoundSigned(api.jsonPut(url, intruder, Map.of("version", 0,
                "product", Map.of("name", "Hack", "unit", "UNIT"))));
        expectNotFound(post(url + "/deactivate"));
        expectNotFound(post(url + "/activate"));
        expectNotFound(delete(url));
        expectNotFound(get("/api/v1/products/lookup").param("code", BARCODE_A));
        expectNotFound(get("/api/v1/products/lookup").param("code", "SKU-A"));
        for (String query : List.of("q=SKU-A", "q=" + BARCODE_A, "categoryId=" + categoryA, "supplierId=" + supplierA)) {
            assertThat(api.getJson("/api/v1/products?" + query, intruder).get("totalElements").asLong())
                    .as(query).isZero();
        }
    }

    @Test
    void foreignImagesAndBarcodesDoNotExist() throws Exception {
        String url = "/api/v1/products/" + productA.get("id").asString();
        expectNotFound(get(url + "/image"));
        mvc.perform(image(HttpMethod.PUT, intruder)).andExpect(status().isNotFound());
        expectNotFound(delete(url + "/image"));
        expectNotFound(post(url + "/barcode"));
        expectNotFound(get(url + "/barcode.png"));
        expectNotFound(get(url + "/barcode.svg"));
        mvc.perform(api.jsonPost("/api/v1/barcodes/labels", intruder,
                        Map.of("items", List.of(Map.of("productId", productA.get("id").asString(), "copies", 1)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_NOT_FOUND"));
    }

    @Test
    void foreignCategoriesAndSuppliersCannotBeReferenced() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/products", intruder,
                        Map.of("name", "B", "unit", "UNIT", "categoryId", categoryA)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_CATEGORY_UNKNOWN"));
        mvc.perform(api.jsonPost("/api/v1/products", intruder,
                        Map.of("name", "B", "unit", "UNIT", "defaultSupplierId", supplierA)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_SUPPLIER_UNKNOWN"));

        JsonNode own = api.create("/api/v1/products", intruder, Map.of("name", "B", "unit", "UNIT"));
        mvc.perform(api.jsonPut("/api/v1/products/" + own.get("id").asString(), intruder, Map.of("version", 0,
                        "product", Map.of("name", "B", "unit", "UNIT", "categoryId", categoryA))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_CATEGORY_UNKNOWN"));
    }

    @Test
    void importsResolveReferencesInTheCallersCompanyOnly() throws Exception {
        byte[] file = """
                sku,name,category,supplierCode,barcode
                SKU-A,Produit B,Boissons A,SUPA,
                SKU-B,Produit B2,,,%s
                """.formatted(BARCODE_A).getBytes(StandardCharsets.UTF_8);
        JsonNode report = api.read(mvc.perform(multipart("/api/v1/products/imports/preview")
                        .file(new MockMultipartFile("file", "b.csv", "text/csv", file))
                        .header("Authorization", intruder.bearer()))
                .andExpect(status().isOk()).andReturn());

        // A's SKU is not an update of A's product, and A's category and supplier are unknown in B.
        JsonNode first = report.get("rows").get(0);
        assertThat(first.get("action").asString()).isEqualTo("ERROR");
        assertThat(first.get("issues").toString()).contains("IMPORT_CATEGORY_UNKNOWN", "IMPORT_SUPPLIER_UNKNOWN");
        assertThat(report.get("updateCount").asInt()).isZero();
        // Barcodes are unique per company: A's barcode is free in B.
        assertThat(report.get("rows").get(1).get("action").asString()).isEqualTo("CREATE");

        mvc.perform(post("/api/v1/products/imports/" + report.get("jobId").asString() + "/commit")
                        .header("Authorization", companyA.admin().bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void companyAIsLeftUntouched() throws Exception {
        foreignProductsDoNotExist();
        foreignImagesAndBarcodesDoNotExist();
        JsonNode after = api.getJson("/api/v1/products/" + productA.get("id").asString(), companyA.admin());
        assertThat(after.get("version")).isEqualTo(productA.get("version"));
        assertThat(after.get("name").asString()).isEqualTo("Produit A");
        assertThat(after.get("active").asBoolean()).isTrue();
        assertThat(after.get("barcode").asString()).isEqualTo(BARCODE_A);
        assertThat(after.get("hasImage").asBoolean()).isTrue();
    }

    private void expectNotFound(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        mvc.perform(request.header("Authorization", intruder.bearer())).andExpect(status().isNotFound());
    }

    /** For requests already signed by the intruder (the JSON helpers add the header). */
    private void expectNotFoundSigned(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        mvc.perform(request).andExpect(status().isNotFound());
    }

    private AbstractMockHttpServletRequestBuilder<?> image(HttpMethod method, Session session) {
        return multipart(method, "/api/v1/products/" + productA.get("id").asString() + "/image")
                .file(new MockMultipartFile("file", "p.png", "image/png", PNG))
                .header("Authorization", session.bearer());
    }
}
