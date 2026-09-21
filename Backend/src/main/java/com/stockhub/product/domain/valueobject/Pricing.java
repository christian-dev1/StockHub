package com.stockhub.product.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.math.BigDecimal;

/** Purchase and sale prices, in the company currency (4 decimals max, never negative). */
public record Pricing(BigDecimal purchasePrice, BigDecimal salePrice) {

    public static final Pricing ZERO = new Pricing(BigDecimal.ZERO, BigDecimal.ZERO);

    public Pricing {
        purchasePrice = valid(purchasePrice, "purchasePrice");
        salePrice = valid(salePrice, "salePrice");
    }

    /** Sale price below purchase price is allowed (promotions) but worth flagging in the UI. */
    public boolean sellsAtLoss() {
        return salePrice.compareTo(purchasePrice) < 0;
    }

    private static BigDecimal valid(BigDecimal amount, String field) {
        BigDecimal value = amount == null ? BigDecimal.ZERO : amount;
        if (value.signum() < 0) {
            throw new InvalidInputException(field, "PRODUCT_PRICE_NEGATIVE", "Prices cannot be negative.");
        }
        if (value.stripTrailingZeros().scale() > 4 || value.precision() - value.scale() > 15) {
            throw new InvalidInputException(field, "PRODUCT_PRICE_INVALID", "Price has too many digits.");
        }
        return value;
    }
}
