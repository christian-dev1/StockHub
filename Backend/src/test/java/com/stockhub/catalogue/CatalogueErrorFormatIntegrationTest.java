package com.stockhub.catalogue;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/** Catalogue failures all use the global ApiError format with a stable code; none ends as a 500. */
class CatalogueErrorFormatIntegrationTest extends AbstractIntegrationTest {

    private Session admin;

    @BeforeEach
    void tenant() throws Exception {
        admin = api.newTenant("Errors").admin();
    }

    @Test
    void businessErrorsCarryTheirCode() throws Exception {
        api.create("/api/v1/products", admin, Map.of("sku", "DUP", "name", "A", "unit", "UNIT",
                "barcode", "4006381333931"));
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin, Map.of("sku", "dup", "name", "B", "unit", "UNIT"))),
                409, "PRODUCT_SKU_ALREADY_EXISTS");
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin,
                Map.of("name", "B", "unit", "UNIT", "barcode", "4006381333931"))), 409, "PRODUCT_BARCODE_ALREADY_EXISTS");
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin,
                Map.of("name", "B", "unit", "UNIT", "categoryId", UUID.randomUUID()))), 400, "PRODUCT_CATEGORY_UNKNOWN")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("categoryId"));
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin,
                Map.of("name", "B", "unit", "UNIT", "defaultSupplierId", UUID.randomUUID()))), 400, "PRODUCT_SUPPLIER_UNKNOWN");
        expectError(mvc.perform(get("/api/v1/categories/" + UUID.randomUUID()).header("Authorization", admin.bearer())),
                404, "CATEGORY_NOT_FOUND");
        expectError(mvc.perform(get("/api/v1/locations/" + UUID.randomUUID()).header("Authorization", admin.bearer())),
                404, "LOCATION_NOT_FOUND");
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin,
                Map.of("name", "B", "unit", "UNIT", "barcode", "4006381333932"))), 400, "PRODUCT_BARCODE_INVALID_CHECK_DIGIT");
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin,
                Map.of("name", "B", "unit", "UNIT", "salePrice", -1))), 400, "VALIDATION_FAILED")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("salePrice"));
    }

    @Test
    void messagesAreFormattedWithTheirArguments() throws Exception {
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin,
                        Map.of("name", "B", "unit", "UNIT", "barcode", "123", "barcodeFormat", "EAN13"))),
                400, "PRODUCT_BARCODE_INVALID_LENGTH")
                .andExpect(jsonPath("$.message").value("This barcode format requires exactly 13 digits."))
                .andExpect(jsonPath("$.fieldErrors[0].message").value(not(containsString("%"))));
    }

    @Test
    void malformedRequestsAreClientErrorsNamingTheField() throws Exception {
        expectError(mvc.perform(get("/api/v1/products/lookup").header("Authorization", admin.bearer())),
                400, "VALIDATION_FAILED")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("code"));
        expectError(mvc.perform(multipart(HttpMethod.PUT, "/api/v1/products/" + UUID.randomUUID() + "/image")
                .param("other", "x").header("Authorization", admin.bearer())), 400, "VALIDATION_FAILED")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("file"));
        expectError(mvc.perform(multipart("/api/v1/products/imports/preview").header("Authorization", admin.bearer())),
                400, "VALIDATION_FAILED");
        expectError(mvc.perform(put("/api/v1/products/" + UUID.randomUUID() + "/image")
                .contentType(MediaType.APPLICATION_JSON).content("{}").header("Authorization", admin.bearer())),
                415, "UNSUPPORTED_MEDIA_TYPE");
        expectError(mvc.perform(post("/api/v1/products").contentType(MediaType.TEXT_PLAIN).content("x")
                .header("Authorization", admin.bearer())), 415, "UNSUPPORTED_MEDIA_TYPE");
        expectError(mvc.perform(api.jsonPost("/api/v1/products", admin, Map.of("name", "B", "unit", "PIECE"))),
                400, "MALFORMED_REQUEST")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("unit"));
        expectError(mvc.perform(api.jsonPost("/api/v1/barcodes/labels", admin,
                Map.of("items", List.of(Map.of("productId", "not-a-uuid", "copies", 1))))), 400, "MALFORMED_REQUEST")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("items[0].productId"));
        expectError(mvc.perform(get("/api/v1/products/not-a-uuid").header("Authorization", admin.bearer())),
                400, "INVALID_PARAMETER")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("id"));
    }

    @Test
    void barcodeGenerationReturnsATypedBody() throws Exception {
        String id = api.create("/api/v1/products", admin, Map.of("name", "A", "unit", "UNIT")).get("id").asString();
        mvc.perform(api.jsonPost("/api/v1/products/" + id + "/barcode", admin, Map.of("format", "EAN13")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.barcodeFormat").value("EAN13"))
                .andExpect(jsonPath("$.barcode").value(matchesPattern("20\\d{11}")));
    }

    private static ResultActions expectError(ResultActions result, int status, String code) throws Exception {
        return result.andExpect(status().is(status))
                .andExpect(jsonPath("$.status").value(status))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }
}
