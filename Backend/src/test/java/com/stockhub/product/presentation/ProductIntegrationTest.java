package com.stockhub.product.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.JsonNode;

class ProductIntegrationTest extends AbstractIntegrationTest {

    /** Smallest valid PNG (1x1 transparent pixel). */
    private static final byte[] PNG = java.util.Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

    private TenantFixture tenant;

    @BeforeEach
    void setUp() throws Exception {
        tenant = api.newTenant("Prod");
    }

    private JsonNode createProduct(Map<String, Object> overrides) throws Exception {
        Map<String, Object> body = new HashMap<>(Map.of("name", "Produit", "unit", "UNIT", "salePrice", 500,
                "purchasePrice", 300));
        body.putAll(overrides);
        return api.create("/api/v1/products", tenant.admin(), body);
    }

    @Test
    void generatesSkuAndDetectsBarcodeFormat() throws Exception {
        var product = createProduct(Map.of("name", "Lait 1L", "barcode", "4006381333931"));
        assertThat(product.get("sku").asString()).isEqualTo("PRD-000001");
        assertThat(product.get("barcodeFormat").asString()).isEqualTo("EAN13");
        assertThat(product.get("active").asBoolean()).isTrue();
        assertThat(createProduct(Map.of()).get("sku").asString()).isEqualTo("PRD-000002");
    }

    @Test
    void skuAndBarcodeAreUniquePerCompanyOnly() throws Exception {
        createProduct(Map.of("sku", "RIZ-5", "barcode", "5449000000996"));
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(), Map.of("sku", "riz-5", "name", "X", "unit", "UNIT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRODUCT_SKU_ALREADY_EXISTS"));
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(),
                        Map.of("name", "X", "unit", "UNIT", "barcode", "5449000000996")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRODUCT_BARCODE_ALREADY_EXISTS"));

        TenantFixture other = api.newTenant("ProdOther");
        api.create("/api/v1/products", other.admin(),
                Map.of("sku", "RIZ-5", "name", "Riz", "unit", "UNIT", "barcode", "5449000000996"));
    }

    @Test
    void validatesBusinessRules() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(),
                        Map.of("name", "X", "unit", "UNIT", "barcode", "4006381333932", "barcodeFormat", "EAN13")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_BARCODE_INVALID_CHECK_DIGIT"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("barcode"));
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(),
                        Map.of("name", "X", "unit", "UNIT", "expiryTracked", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_EXPIRY_REQUIRES_BATCH"));
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(), Map.of("name", "X", "unit", "UNIT", "salePrice", -1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void referencesMustBelongToTheCompany() throws Exception {
        TenantFixture other = api.newTenant("ProdRef");
        var foreignCategory = api.create("/api/v1/categories", other.admin(), Map.of("name", "Autre"));
        var foreignSupplier = api.create("/api/v1/suppliers", other.admin(), Map.of("name", "Autre"));
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(),
                        Map.of("name", "X", "unit", "UNIT", "categoryId", foreignCategory.get("id").asString())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_CATEGORY_UNKNOWN"));
        mvc.perform(api.jsonPost("/api/v1/products", tenant.admin(),
                        Map.of("name", "X", "unit", "UNIT", "defaultSupplierId", foreignSupplier.get("id").asString())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_SUPPLIER_UNKNOWN"));
    }

    @Test
    void searchCombinesFilters() throws Exception {
        var drinks = api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Boissons"));
        var sodas = api.create("/api/v1/categories", tenant.admin(),
                Map.of("name", "Sodas", "parentId", drinks.get("id").asString()));
        var supplier = api.create("/api/v1/suppliers", tenant.admin(), Map.of("name", "SABC"));
        createProduct(Map.of("sku", "COCA-33", "name", "Coca-Cola canette 33cl", "barcode", "5449000000996",
                "categoryId", sodas.get("id").asString(), "defaultSupplierId", supplier.get("id").asString()));
        createProduct(Map.of("sku", "EAU-15", "name", "Eau minérale 1.5L", "categoryId", drinks.get("id").asString()));
        var inactive = createProduct(Map.of("sku", "OLD-1", "name", "Ancien produit"));
        mvc.perform(post("/api/v1/products/" + inactive.get("id").asString() + "/deactivate")
                .header("Authorization", tenant.admin().bearer())).andExpect(status().isOk());

        assertThat(total("/api/v1/products?categoryId=" + drinks.get("id").asString())).isEqualTo(2);
        assertThat(total("/api/v1/products?categoryId=" + sodas.get("id").asString())).isEqualTo(1);
        assertThat(total("/api/v1/products?q=canette")).isEqualTo(1);
        assertThat(total("/api/v1/products?q=coca cola")).isEqualTo(1);
        assertThat(total("/api/v1/products?q=eau-")).isEqualTo(1);
        assertThat(total("/api/v1/products?q=5449000000996")).isEqualTo(1);
        assertThat(total("/api/v1/products?supplierId=" + supplier.get("id").asString())).isEqualTo(1);
        assertThat(total("/api/v1/products?active=false")).isEqualTo(1);
        assertThat(total("/api/v1/products?hasBarcode=true&active=true")).isEqualTo(1);
        var page = api.getJson("/api/v1/products?sort=sku,desc&size=2", tenant.admin());
        assertThat(page.get("totalPages").asInt()).isEqualTo(2);
        assertThat(page.get("content").get(0).get("sku").asString()).isEqualTo("OLD-1");
        assertThat(page.get("content").get(1).get("categoryName").asString()).isEqualTo("Boissons");
    }

    @Test
    void lookupFindsByBarcodeThenSku() throws Exception {
        createProduct(Map.of("sku", "LAIT-1", "barcode", "4006381333931"));
        mvc.perform(get("/api/v1/products/lookup").param("code", "4006381333931").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.sku").value("LAIT-1"));
        mvc.perform(get("/api/v1/products/lookup").param("code", "lait-1").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.barcode").value("4006381333931"));
        mvc.perform(get("/api/v1/products/lookup").param("code", "0000").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("PRODUCT_NOT_FOUND"));
    }

    @Test
    void updateUsesOptimisticLockingAndKeepsSkuWhenBlank() throws Exception {
        var product = createProduct(Map.of("sku", "SUCRE-1", "barcode", "4006381333931"));
        String url = "/api/v1/products/" + product.get("id").asString();
        var update = Map.of("product", Map.of("name", "Sucre 1kg", "unit", "UNIT", "salePrice", 900), "version", 0);
        mvc.perform(api.jsonPut(url, tenant.admin(), update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("SUCRE-1"))
                .andExpect(jsonPath("$.name").value("Sucre 1kg"))
                .andExpect(jsonPath("$.barcode").doesNotExist());
        mvc.perform(api.jsonPut(url, tenant.admin(), update))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENT_MODIFICATION"));
    }

    @Test
    void softDeleteHidesTheProductAndFreesItsSku() throws Exception {
        var product = createProduct(Map.of("sku", "TMP-1"));
        String url = "/api/v1/products/" + product.get("id").asString();
        mvc.perform(delete(url).header("Authorization", tenant.admin().bearer())).andExpect(status().isNoContent());
        mvc.perform(get(url).header("Authorization", tenant.admin().bearer())).andExpect(status().isNotFound());
        createProduct(Map.of("sku", "TMP-1"));
    }

    @Test
    void storesImagesDetectedFromContent() throws Exception {
        var product = createProduct(Map.of());
        String url = "/api/v1/products/" + product.get("id").asString() + "/image";
        mvc.perform(multipart(HttpMethod.PUT, url).file(new MockMultipartFile("file", "photo.png", "image/png", PNG))
                .header("Authorization", tenant.admin().bearer())).andExpect(status().isNoContent());
        mvc.perform(get(url).header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(PNG));
        assertThat(api.getJson("/api/v1/products/" + product.get("id").asString(), tenant.admin()).get("hasImage").asBoolean())
                .isTrue();

        mvc.perform(multipart(HttpMethod.PUT, url)
                        .file(new MockMultipartFile("file", "evil.png", "image/png", "<script>".getBytes()))
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRODUCT_IMAGE_UNSUPPORTED"));
    }

    @Test
    void sellersReadTheCatalogueButCannotChangeIt() throws Exception {
        var product = createProduct(Map.of());
        Session seller = api.userSession(tenant.admin(), "VENDEUR", List.of());
        mvc.perform(get("/api/v1/products").header("Authorization", seller.bearer())).andExpect(status().isOk());
        mvc.perform(api.jsonPost("/api/v1/products", seller, Map.of("name", "X", "unit", "UNIT")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/products/" + product.get("id").asString()).header("Authorization", seller.bearer()))
                .andExpect(status().isForbidden());
    }

    @Test
    void productsOfAnotherCompanyAreInvisible() throws Exception {
        var product = createProduct(Map.of("barcode", "4006381333931"));
        TenantFixture other = api.newTenant("ProdIntruder");
        mvc.perform(get("/api/v1/products/" + product.get("id").asString()).header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/products/lookup").param("code", "4006381333931")
                        .header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/products/" + product.get("id").asString()).header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
        assertThat(api.getJson("/api/v1/products", other.admin()).get("totalElements").asLong()).isZero();
    }

    private long total(String url) throws Exception {
        return api.getJson(url, tenant.admin()).get("totalElements").asLong();
    }
}
