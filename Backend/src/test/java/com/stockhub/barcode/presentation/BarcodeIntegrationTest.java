package com.stockhub.barcode.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.barcode.domain.service.BarcodeValueGenerator;
import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BarcodeIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;
    private String productId;

    @BeforeEach
    void setUp() throws Exception {
        tenant = api.newTenant("Bar");
        productId = api.create("/api/v1/products", tenant.admin(),
                Map.of("name", "Crème éclaircissante", "unit", "UNIT", "salePrice", 1500)).get("id").asString();
    }

    private String generate(Session session, Map<String, Object> body) throws Exception {
        return api.read(mvc.perform(api.jsonPost("/api/v1/products/" + productId + "/barcode", session, body))
                .andExpect(status().isOk()).andReturn()).get("barcode").asString();
    }

    @Test
    void generatesAValidInStoreEan13AndRefusesSilentReplacement() throws Exception {
        String ean = generate(tenant.admin(), Map.of("format", "EAN13"));
        assertThat(ean).hasSize(13).startsWith("20");
        assertThat(ean.charAt(12) - '0').isEqualTo(BarcodeValueGenerator.gs1CheckDigit(ean.substring(0, 12)));
        assertThat(api.getJson("/api/v1/products/" + productId, tenant.admin()).get("barcode").asString()).isEqualTo(ean);

        mvc.perform(api.jsonPost("/api/v1/products/" + productId + "/barcode", tenant.admin(), Map.of("format", "EAN13")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BARCODE_ALREADY_ASSIGNED"));
        String replaced = generate(tenant.admin(), Map.of("format", "CODE128", "replaceExisting", true));
        assertThat(replaced).startsWith("SH");
    }

    @Test
    void rendersPngAndSvg() throws Exception {
        mvc.perform(get("/api/v1/products/" + productId + "/barcode.png").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BARCODE_MISSING"));
        generate(tenant.admin(), Map.of());
        byte[] png = mvc.perform(get("/api/v1/products/" + productId + "/barcode.png")
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(png).startsWith(0x89, 'P', 'N', 'G');
        String svg = mvc.perform(get("/api/v1/products/" + productId + "/barcode.svg")
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(svg).startsWith("<svg").contains("<rect x=");
    }

    @Test
    void printsLabelSheetsAsPdf() throws Exception {
        generate(tenant.admin(), Map.of("format", "EAN13"));
        Session storekeeper = api.userSession(tenant.admin(), "MAGASINIER", List.of());
        byte[] pdf = mvc.perform(api.jsonPost("/api/v1/barcodes/labels", storekeeper,
                        Map.of("items", List.of(Map.of("productId", productId, "copies", 30)), "layout", "A4_3X8",
                                "startPosition", 5)))
                .andExpect(status().isOk()).andExpect(content().contentType("application/pdf"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        try (var document = org.apache.pdfbox.Loader.loadPDF(pdf)) {
            assertThat(document.getNumberOfPages()).isEqualTo(2);
        }
    }

    @Test
    void sellersCannotGenerateNorPrint() throws Exception {
        Session seller = api.userSession(tenant.admin(), "VENDEUR", List.of());
        mvc.perform(api.jsonPost("/api/v1/products/" + productId + "/barcode", seller, Map.of()))
                .andExpect(status().isForbidden());
        mvc.perform(api.jsonPost("/api/v1/barcodes/labels", seller,
                        Map.of("items", List.of(Map.of("productId", productId, "copies", 1)))))
                .andExpect(status().isForbidden());
    }

    @Test
    void cannotGenerateForAnotherCompanysProduct() throws Exception {
        TenantFixture other = api.newTenant("BarOther");
        mvc.perform(api.jsonPost("/api/v1/products/" + productId + "/barcode", other.admin(), Map.of()))
                .andExpect(status().isNotFound());
    }
}
