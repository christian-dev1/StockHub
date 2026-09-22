package com.stockhub.stock.domain.model;

import java.time.LocalDate;

/** Freshness of a batch, relative to the company's expiry warning window. */
public enum ExpiryStatus {
    /** No expiry date, or expiring after the warning window. */
    VALID,
    EXPIRING_SOON,
    EXPIRED;

    /**
     * A batch is expired from the day after its expiration date, and expiring soon when it expires
     * within {@code warningDays} days (inclusive).
     */
    public static ExpiryStatus of(LocalDate expirationDate, LocalDate today, int warningDays) {
        if (expirationDate == null) {
            return VALID;
        }
        if (expirationDate.isBefore(today)) {
            return EXPIRED;
        }
        return expirationDate.isAfter(today.plusDays(warningDays)) ? VALID : EXPIRING_SOON;
    }
}
