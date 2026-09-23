package com.stockhub.sale.domain.model;

/** How a sale was paid; the list offered to the point of sale comes from this enum. */
public enum PaymentMethod {
    CASH,
    CARD,
    MOBILE_MONEY,
    BANK_TRANSFER,
    OTHER
}
