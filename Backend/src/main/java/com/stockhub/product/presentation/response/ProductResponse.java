package com.stockhub.product.presentation.response;

import com.stockhub.product.application.dto.ProductView;
import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String sku,
        String barcode,
        String barcodeFormat,
        String name,
        String description,
        UUID categoryId,
        String categoryName,
        UUID defaultSupplierId,
        String defaultSupplierName,
        String unit,
        BigDecimal purchasePrice,
        BigDecimal salePrice,
        BigDecimal minStock,
        BigDecimal reorderQuantity,
        boolean batchTracked,
        boolean expiryTracked,
        boolean active,
        boolean hasImage,
        long version) {

    public static ProductResponse from(ProductView v) {
        return new ProductResponse(v.id(), v.sku(), v.barcode(), v.barcodeFormat(), v.name(), v.description(),
                v.categoryId(), v.categoryName(), v.defaultSupplierId(), v.defaultSupplierName(), v.unit(),
                v.purchasePrice(), v.salePrice(), v.minStock(), v.reorderQuantity(), v.batchTracked(),
                v.expiryTracked(), v.active(), v.hasImage(), v.version());
    }
}
