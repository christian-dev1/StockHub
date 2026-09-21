package com.stockhub.barcode.domain.model;

/**
 * Content of one printed label.
 *
 * @param price formatted price, or {@code null} to omit it
 */
public record Label(String productName, String sku, String barcode, Symbology symbology, String price) {
}
