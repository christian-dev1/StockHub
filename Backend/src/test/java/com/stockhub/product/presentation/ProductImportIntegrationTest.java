package com.stockhub.product.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.JsonNode;

class ProductImportIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;

    @BeforeEach
    void setUp() throws Exception {
        tenant = api.newTenant("Imp");
        api.create("/api/v1/suppliers", tenant.admin(), Map.of("code", "SABC", "name", "SABC"));
        api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Boissons"));
    }

    private JsonNode preview(String fileName, byte[] content, boolean createCategories) throws Exception {
        return api.read(mvc.perform(multipart("/api/v1/products/imports/preview")
                        .file(new MockMultipartFile("file", fileName, "text/csv", content))
                        .param("createMissingCategories", String.valueOf(createCategories))
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk()).andReturn());
    }

    private static byte[] csv(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    @Test
    void previewReportsEveryInvalidRowWithoutWritingAnything() throws Exception {
        byte[] file = csv("""
                SKU;Désignation;Catégorie;Fournisseur;Prix de vente;Code-barres;Lots;DLC
                COCA-33;Coca-Cola 33cl;Boissons;SABC;450;5449000000996;non;non
                ;Sans catégorie;Inconnue;;abc;;;
                COCA-33;Doublon;Boissons;;100;;;
                LAIT;Lait;Boissons;NOPE;900;4006381333932;non;oui
                """);
        JsonNode report = preview("catalogue.csv", file, false);
        assertThat(report.get("totalRows").asInt()).isEqualTo(4);
        assertThat(report.get("createCount").asInt()).isEqualTo(1);
        assertThat(report.get("errorCount").asInt()).isEqualTo(3);
        JsonNode rows = report.get("rows");
        assertThat(rows.get(0).get("rowNumber").asInt()).isEqualTo(2);
        assertThat(codes(rows.get(1))).contains("IMPORT_CATEGORY_UNKNOWN", "IMPORT_VALUE_INVALID");
        assertThat(codes(rows.get(2))).contains("IMPORT_DUPLICATE_SKU");
        assertThat(codes(rows.get(3))).contains("IMPORT_SUPPLIER_UNKNOWN", "PRODUCT_BARCODE_INVALID_CHECK_DIGIT",
                "PRODUCT_EXPIRY_REQUIRES_BATCH");
        assertThat(api.getJson("/api/v1/products", tenant.admin()).get("totalElements").asLong()).isZero();

        mvc.perform(post("/api/v1/products/imports/" + report.get("jobId").asString() + "/commit")
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("IMPORT_HAS_ERRORS"));
    }

    @Test
    void commitCreatesUpdatesAndCreatesMissingCategoriesAllAtOnce() throws Exception {
        api.create("/api/v1/products", tenant.admin(),
                Map.of("sku", "RIZ-5", "name", "Riz 5kg", "unit", "UNIT", "salePrice", 4000, "barcode", "4006381333931"));
        byte[] file = csv("""
                sku,name,category,supplierCode,unit,salePrice,minStock,batchTracked,expiryTracked
                RIZ-5,,Épicerie,,,"4 500",10,,
                ,Yaourt nature,Frais,SABC,unit,350,24,oui,oui
                ,Fromage,frais,,kg,"2 500,50",1.5,true,true
                """);
        JsonNode report = preview("catalogue.csv", file, true);
        assertThat(report.get("errorCount").asInt()).isZero();
        assertThat(report.get("updateCount").asInt()).isEqualTo(1);
        assertThat(report.get("createCount").asInt()).isEqualTo(2);
        assertThat(report.get("categoriesToCreate").size()).isEqualTo(2);

        String commitUrl = "/api/v1/products/imports/" + report.get("jobId").asString() + "/commit";
        mvc.perform(post(commitUrl).header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(2))
                .andExpect(jsonPath("$.updated").value(1))
                .andExpect(jsonPath("$.categoriesCreated").value(2));

        JsonNode rice = api.getJson("/api/v1/products/lookup?code=RIZ-5", tenant.admin());
        assertThat(rice.get("name").asString()).isEqualTo("Riz 5kg");
        assertThat(rice.get("salePrice").decimalValue()).isEqualByComparingTo("4500");
        assertThat(rice.get("barcode").asString()).isEqualTo("4006381333931");
        assertThat(rice.get("categoryName").asString()).isEqualTo("Épicerie");
        JsonNode cheese = api.getJson("/api/v1/products?q=fromage", tenant.admin()).get("content").get(0);
        assertThat(cheese.get("unit").asString()).isEqualTo("KG");
        assertThat(cheese.get("salePrice").decimalValue()).isEqualByComparingTo("2500.50");
        assertThat(cheese.get("expiryTracked").asBoolean()).isTrue();

        mvc.perform(post(commitUrl).header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("IMPORT_ALREADY_COMMITTED"));
    }

    @Test
    void readsExcelFiles() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Produits");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Nom");
            header.createCell(1).setCellValue("Prix de vente");
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("Savon");
            row.createCell(1).setCellValue(250);
            workbook.write(out);
        }
        JsonNode report = preview("produits.xlsx", out.toByteArray(), false);
        assertThat(report.get("createCount").asInt()).isEqualTo(1);
        assertThat(report.get("rows").get(0).get("name").asString()).isEqualTo("Savon");
    }

    @Test
    void rejectsUnsupportedFilesAndForeignJobs() throws Exception {
        mvc.perform(multipart("/api/v1/products/imports/preview")
                        .file(new MockMultipartFile("file", "data.pdf", "application/pdf", new byte[]{1, 2}))
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("IMPORT_FORMAT_UNSUPPORTED"));

        JsonNode report = preview("ok.csv", csv("name\nThé vert\n"), false);
        TenantFixture other = api.newTenant("ImpOther");
        mvc.perform(post("/api/v1/products/imports/" + report.get("jobId").asString() + "/commit")
                        .header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsDuplicateBarcodesAndNegativePrices() throws Exception {
        api.create("/api/v1/products", tenant.admin(),
                Map.of("sku", "EXIST", "name", "Existant", "unit", "UNIT", "barcode", "4006381333931"));
        JsonNode report = preview("barcodes.csv", csv("""
                sku,name,barcode,salePrice
                A1,Un,5449000000996,100
                A2,Deux,5449000000996,100
                A3,Trois,4006381333931,100
                A4,Quatre,,-5
                """), false);
        JsonNode rows = report.get("rows");
        assertThat(codes(rows.get(0))).isEmpty();
        assertThat(codes(rows.get(1))).contains("IMPORT_DUPLICATE_BARCODE");
        assertThat(codes(rows.get(2))).contains("PRODUCT_BARCODE_ALREADY_EXISTS");
        assertThat(codes(rows.get(3))).contains("PRODUCT_PRICE_NEGATIVE");
        assertThat(report.get("errorCount").asInt()).isEqualTo(3);
    }

    @Test
    void templateIsDownloadable() throws Exception {
        String template = mvc.perform(get("/api/v1/products/imports/template").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(template).contains("sku,name,description,category,supplierCode");
    }

    private static java.util.List<String> codes(JsonNode row) {
        java.util.List<String> codes = new java.util.ArrayList<>();
        row.get("issues").forEach(issue -> codes.add(issue.get("code").asString()));
        return codes;
    }
}
