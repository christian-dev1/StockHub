package com.stockhub.stock.domain.model;

public enum BatchStatus {
    ACTIVE,
    /** Quantity is zero; the batch reopens when the same number is received again. */
    DEPLETED
}
