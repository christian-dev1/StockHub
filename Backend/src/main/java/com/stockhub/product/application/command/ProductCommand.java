package com.stockhub.product.application.command;

import com.stockhub.product.domain.model.ProductDetails;
import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.product.domain.valueobject.BarcodeFormat;
import com.stockhub.product.domain.valueobject.Pricing;
import com.stockhub.product.domain.valueobject.StockPolicy;
import com.stockhub.product.domain.valueobject.Tracking;
import com.stockhub.product.domain.valueobject.Unit;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * @param sku           optional on creation: generated ({@code PRD-000001}) when blank
 * @param barcodeFormat optional: detected from the value when omitted
 */
public record ProductCommand(
        String sku,
        String barcode,
        BarcodeFormat barcodeFormat,
        String name,
        String description,
        UUID categoryId,
        UUID defaultSupplierId,
        Unit unit,
        BigDecimal purchasePrice,
        BigDecimal salePrice,
        BigDecimal minStock,
        BigDecimal reorderQuantity,
        boolean batchTracked,
        boolean expiryTracked) {

    public ProductDetails details() {
        return new ProductDetails(name, description, categoryId, defaultSupplierId, unit,
                new Pricing(purchasePrice, salePrice), new StockPolicy(minStock, reorderQuantity));
    }

    public Tracking tracking() {
        return new Tracking(batchTracked, expiryTracked);
    }

    /** {@code null} when no barcode is given. */
    public Barcode barcodeValue() {
        if (barcode == null || barcode.isBlank()) {
            return null;
        }
        return barcodeFormat == null ? Barcode.detect(barcode) : new Barcode(barcode, barcodeFormat);
    }
}
