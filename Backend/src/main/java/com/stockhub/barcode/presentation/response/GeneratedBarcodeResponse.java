package com.stockhub.barcode.presentation.response;

import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.product.ProductSummary;

/** The barcode now assigned to the product. */
public record GeneratedBarcodeResponse(String barcode, Symbology barcodeFormat) {

    public static GeneratedBarcodeResponse from(ProductSummary product) {
        return new GeneratedBarcodeResponse(product.barcode(), Symbology.valueOf(product.barcodeFormat()));
    }
}
