package com.stockhub.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

/** The published contract of the catalogue: success codes, errors, permissions, enums and pagination. */
class CatalogueOpenApiIntegrationTest extends AbstractIntegrationTest {

    @Test
    void documentsTheCatalogueContract() throws Exception {
        JsonNode doc = api.read(mvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn());
        JsonNode paths = doc.get("paths");

        JsonNode createProduct = paths.at("/~1api~1v1~1products/post");
        assertThat(createProduct.at("/responses/201").isMissingNode()).isFalse();
        assertThat(createProduct.at("/responses/409/content/application~1json/schema/$ref").asString())
                .isEqualTo("#/components/schemas/ApiError");
        assertThat(createProduct.at("/x-required-authority").asString()).isEqualTo("hasAuthority('PRODUCT_CREATE')");
        assertThat(paths.at("/~1api~1v1~1products~1{id}/delete/responses/204").isMissingNode()).isFalse();
        assertThat(paths.at("/~1api~1v1~1products~1{id}/get/responses/404").isMissingNode()).isFalse();
        assertThat(paths.at("/~1api~1v1~1products~1{id}~1image/put/responses/204").isMissingNode()).isFalse();

        for (String path : new String[]{"/~1api~1v1~1locations/post", "/~1api~1v1~1categories/post",
                "/~1api~1v1~1suppliers/post"}) {
            assertThat(paths.at(path + "/responses/201").isMissingNode()).as(path).isFalse();
            assertThat(paths.at(path + "/x-required-authority").isMissingNode()).as(path).isFalse();
        }

        JsonNode schemas = doc.at("/components/schemas");
        assertThat(schemas.at("/ApiError/properties/fieldErrors").isMissingNode()).isFalse();
        assertThat(schemas.at("/ProductResponse/properties/unit/enum").toString()).contains("UNIT", "KG");
        assertThat(schemas.at("/ProductResponse/properties/barcodeFormat/enum").toString()).contains("EAN13");
        assertThat(schemas.at("/LocationResponse/properties/type/enum").toString()).contains("STORE", "WAREHOUSE", "DEPOT");
        assertThat(schemas.at("/GeneratedBarcodeResponse/properties/barcodeFormat/enum").toString()).contains("CODE128");
        assertThat(schemas.at("/PageResponseProductResponse/properties/totalElements").isMissingNode()).isFalse();
        assertThat(doc.at("/components/securitySchemes/bearerAuth/scheme").asString()).isEqualTo("bearer");
    }
}
