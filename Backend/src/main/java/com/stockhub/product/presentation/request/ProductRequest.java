package com.stockhub.product.presentation.request;

import com.stockhub.product.application.command.ProductCommand;
import com.stockhub.product.domain.valueobject.BarcodeFormat;
import com.stockhub.product.domain.valueobject.Unit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * @param sku           optional on creation (generated when blank); a blank SKU keeps the current one on update
 * @param barcodeFormat optional: detected from the value (EAN-13 / UPC-A / EAN-8 with a valid check digit, else CODE128)
 */
public record ProductRequest(
        @Size(max = 50) String sku,
        @Size(max = 64) String barcode,
        BarcodeFormat barcodeFormat,
        @NotBlank @Size(max = 200) String name,
        @Size(max = 2000) String description,
        UUID categoryId,
        UUID defaultSupplierId,
        @NotNull Unit unit,
        @DecimalMin("0") @Digits(integer = 15, fraction = 4) BigDecimal purchasePrice,
        @DecimalMin("0") @Digits(integer = 15, fraction = 4) BigDecimal salePrice,
        @DecimalMin("0") @Digits(integer = 16, fraction = 3) BigDecimal minStock,
        @DecimalMin(value = "0", inclusive = false) @Digits(integer = 16, fraction = 3) BigDecimal reorderQuantity,
        Boolean batchTracked,
        Boolean expiryTracked) {

    public ProductCommand toCommand() {
        return new ProductCommand(sku, barcode, barcodeFormat, name, description, categoryId, defaultSupplierId, unit,
                purchasePrice, salePrice, minStock, reorderQuantity, Boolean.TRUE.equals(batchTracked),
                Boolean.TRUE.equals(expiryTracked));
    }
}
