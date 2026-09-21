package com.stockhub.product.domain.repository;

import java.util.UUID;

/**
 * Combinable catalogue filters; {@code null} means "no filter".
 *
 * @param text       matches name (contains, typo tolerant), SKU (prefix) or barcode (exact)
 * @param categoryId the category itself or any of its sub-categories
 */
public record ProductSearchCriteria(
        String text,
        UUID categoryId,
        UUID supplierId,
        Boolean active,
        Boolean batchTracked,
        Boolean expiryTracked,
        Boolean hasBarcode) {

    public static ProductSearchCriteria all() {
        return new ProductSearchCriteria(null, null, null, null, null, null, null);
    }
}
