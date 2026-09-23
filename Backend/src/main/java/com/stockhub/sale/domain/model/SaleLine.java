package com.stockhub.sale.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import java.util.UUID;

/**
 * A sold product with the name, SKU, unit and price it had at the time of the sale.
 *
 * @param position 1-based order of the line on the receipt
 */
public record SaleLine(
        int position,
        UUID productId,
        String productName,
        String sku,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal) {

    /** Same precision as the database amounts. */
    public static final int AMOUNT_SCALE = 4;

    public SaleLine {
        Objects.requireNonNull(productId);
        Objects.requireNonNull(productName);
        Objects.requireNonNull(sku);
        Objects.requireNonNull(unit);
        Objects.requireNonNull(quantity);
        Objects.requireNonNull(unitPrice);
        Objects.requireNonNull(lineTotal);
    }

    /** Prices a line: the total is always computed here, never taken from the client. */
    public static SaleLine priced(
            int position,
            UUID productId,
            String productName,
            String sku,
            String unit,
            BigDecimal quantity,
            BigDecimal unitPrice) {
        return new SaleLine(
                position,
                productId,
                productName,
                sku,
                unit,
                quantity,
                unitPrice,
                unitPrice.multiply(quantity).setScale(AMOUNT_SCALE, RoundingMode.HALF_UP));
    }
}
