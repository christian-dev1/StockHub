package com.stockhub.product.presentation.controller;

import com.stockhub.product.application.dto.ImportPreview;
import com.stockhub.product.application.dto.ImportResult;
import com.stockhub.product.application.usecase.CommitProductImportUseCase;
import com.stockhub.product.application.usecase.PreviewProductImportUseCase;
import com.stockhub.product.application.usecase.ProductImportTemplate;
import com.stockhub.shared.domain.exception.InvalidInputException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/products/imports")
@Tag(name = "Product import", description = "Bulk CSV / XLSX import with preview and all-or-nothing commit")
class ProductImportController {

    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;

    private final PreviewProductImportUseCase preview;
    private final CommitProductImportUseCase commit;
    private final ProductImportTemplate template;

    ProductImportController(PreviewProductImportUseCase preview, CommitProductImportUseCase commit,
                            ProductImportTemplate template) {
        this.preview = preview;
        this.commit = commit;
        this.template = template;
    }

    @GetMapping("/template")
    @PreAuthorize("hasAuthority('PRODUCT_IMPORT')")
    ResponseEntity<byte[]> template() {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("stockhub-products-template.csv").build().toString())
                .body(template.csv());
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PRODUCT_IMPORT')")
    @Operation(summary = "Validate a file and report, row by row, what would be created, updated or rejected")
    ImportPreview preview(@RequestParam("file") MultipartFile file,
                          @RequestParam(defaultValue = "false") boolean createMissingCategories) throws IOException {
        if (file.isEmpty()) {
            throw new InvalidInputException("file", "FILE_REQUIRED", "A file is required.");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new InvalidInputException("file", "IMPORT_FILE_TOO_LARGE", "The file must not exceed 5 MB.");
        }
        return preview.execute(file.getOriginalFilename(), file.getBytes(), createMissingCategories);
    }

    @PostMapping("/{jobId}/commit")
    @PreAuthorize("hasAuthority('PRODUCT_IMPORT')")
    @Operation(summary = "Apply a previewed import: all rows or none")
    ImportResult commit(@PathVariable UUID jobId) {
        return commit.execute(jobId);
    }
}
