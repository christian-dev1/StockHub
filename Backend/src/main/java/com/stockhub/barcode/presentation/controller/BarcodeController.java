package com.stockhub.barcode.presentation.controller;

import com.stockhub.barcode.application.usecase.BarcodeQueries;
import com.stockhub.barcode.application.usecase.GenerateBarcodeUseCase;
import com.stockhub.barcode.application.usecase.PrintLabelsUseCase;
import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.barcode.presentation.request.GenerateBarcodeRequest;
import com.stockhub.barcode.presentation.request.PrintLabelsRequest;
import com.stockhub.barcode.presentation.response.GeneratedBarcodeResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Duration;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@Tag(name = "Barcodes")
class BarcodeController {

    private final GenerateBarcodeUseCase generate;
    private final BarcodeQueries queries;
    private final PrintLabelsUseCase printLabels;

    BarcodeController(GenerateBarcodeUseCase generate, BarcodeQueries queries, PrintLabelsUseCase printLabels) {
        this.generate = generate;
        this.queries = queries;
        this.printLabels = printLabels;
    }

    @PostMapping("/api/v1/products/{id}/barcode")
    @PreAuthorize("hasAuthority('BARCODE_GENERATE')")
    @Operation(summary = "Generate and assign a unique barcode (EAN-13 in the in-store range, or CODE128)")
    GeneratedBarcodeResponse generate(@PathVariable UUID id,
                                      @RequestBody(required = false) GenerateBarcodeRequest request) {
        Symbology format = request == null || request.format() == null ? Symbology.CODE128 : request.format();
        boolean replace = request != null && Boolean.TRUE.equals(request.replaceExisting());
        return GeneratedBarcodeResponse.from(generate.execute(id, format, replace));
    }

    @GetMapping(value = "/api/v1/products/{id}/barcode.png", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    ResponseEntity<byte[]> png(@PathVariable UUID id,
                               @RequestParam(defaultValue = "400") @Min(100) @Max(2000) int width,
                               @RequestParam(defaultValue = "120") @Min(30) @Max(1000) int height) {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(queries.png(id, width, height));
    }

    @GetMapping(value = "/api/v1/products/{id}/barcode.svg", produces = "image/svg+xml")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    ResponseEntity<String> svg(@PathVariable UUID id,
                               @RequestParam(defaultValue = "60") @Min(10) @Max(500) int height) {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(queries.svg(id, height));
    }

    @PostMapping(value = "/api/v1/barcodes/labels", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('BARCODE_PRINT')")
    @Operation(summary = "PDF sheet of product labels for A4 adhesive sheets")
    ResponseEntity<byte[]> labels(@Valid @RequestBody PrintLabelsRequest request) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename("stockhub-labels.pdf").build().toString())
                .body(printLabels.execute(request.toCommand()));
    }
}
