package com.stockhub.sale.domain.model;

/**
 * Lifecycle of a sale. Cancellation and refunds are not part of the MVP yet: every recorded sale
 * is COMPLETED.
 */
public enum SaleStatus {
    COMPLETED
}
