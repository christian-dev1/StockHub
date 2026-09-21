package com.stockhub.product.presentation.controller;

import com.stockhub.product.application.usecase.ProductImageUseCase;
import com.stockhub.product.domain.model.ProductImage;
import com.stockhub.shared.domain.exception.InvalidInputException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.time.Duration;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/products/{id}/image")
@Tag(name = "Products")
class ProductImageController {

    private final ProductImageUseCase images;

    ProductImageController(ProductImageUseCase images) {
        this.images = images;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    ResponseEntity<byte[]> get(@PathVariable UUID id) {
        ProductImage image = images.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .header("X-Content-Type-Options", "nosniff")
                .body(image.data());
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    @Operation(summary = "Upload the product picture (PNG, JPEG or WebP, 2 MB max; format detected from content)")
    ResponseEntity<Void> upload(@PathVariable UUID id, @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new InvalidInputException("file", "FILE_REQUIRED", "A file is required.");
        }
        images.upload(id, file.getBytes());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    ResponseEntity<Void> remove(@PathVariable UUID id) {
        images.remove(id);
        return ResponseEntity.noContent().build();
    }
}
