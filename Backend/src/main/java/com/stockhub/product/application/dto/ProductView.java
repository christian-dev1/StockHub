package com.stockhub.product.application.dto;

import com.stockhub.product.domain.model.Product;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public record ProductView(
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

    public static ProductView from(Product p, String categoryName, String supplierName, boolean hasImage) {
        return new ProductView(p.id(), p.sku(), p.barcode() == null ? null : p.barcode().value(),
                p.barcode() == null ? null : p.barcode().format().name(), p.name(), p.description(), p.categoryId(),
                categoryName, p.defaultSupplierId(), supplierName, p.unit().name(), p.pricing().purchasePrice(),
                p.pricing().salePrice(), p.stockPolicy().minStock(), p.stockPolicy().reorderQuantity(),
                p.tracking().batchTracked(), p.tracking().expiryTracked(), p.isActive(), hasImage, p.version());
    }

    public static Map<String, Object> auditSnapshot(Product p) {
        var snapshot = new LinkedHashMap<String, Object>();
        snapshot.put("sku", p.sku());
        snapshot.put("barcode", p.barcode() == null ? null : p.barcode().value());
        snapshot.put("name", p.name());
        snapshot.put("categoryId", p.categoryId());
        snapshot.put("defaultSupplierId", p.defaultSupplierId());
        snapshot.put("unit", p.unit());
        snapshot.put("purchasePrice", p.pricing().purchasePrice());
        snapshot.put("salePrice", p.pricing().salePrice());
        snapshot.put("minStock", p.stockPolicy().minStock());
        snapshot.put("reorderQuantity", p.stockPolicy().reorderQuantity());
        snapshot.put("batchTracked", p.tracking().batchTracked());
        snapshot.put("expiryTracked", p.tracking().expiryTracked());
        snapshot.put("active", p.isActive());
        return snapshot;
    }
}
