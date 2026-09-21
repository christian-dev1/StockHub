package com.stockhub.product;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummary(
        UUID id,
        String sku,
        String barcode,
        String barcodeFormat,
        String name,
        String unit,
        UUID categoryId,
        UUID defaultSupplierId,
        BigDecimal purchasePrice,
        BigDecimal salePrice,
        BigDecimal minStock,
        BigDecimal reorderQuantity,
        boolean batchTracked,
        boolean expiryTracked,
        boolean active) {
}
