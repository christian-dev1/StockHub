package com.stockhub.stock.domain.model;

import com.stockhub.stock.domain.exception.StockErrors;

import java.math.BigDecimal;
import java.util.Set;

/** Validation of moved quantities (same precision as the database: 3 decimals). */
public final class Quantities {

    private static final Set<String> DISCRETE_UNITS = Set.of("UNIT", "BOX", "PACK");

    private Quantities() {}

    public static BigDecimal requirePositive(BigDecimal quantity, String unit, String field) {
        if (quantity == null
                || quantity.signum() <= 0
                || quantity.stripTrailingZeros().scale() > 3
                || quantity.precision() - quantity.scale() > 16) {
            throw StockErrors.quantityInvalid(field);
        }
        if (DISCRETE_UNITS.contains(unit) && quantity.stripTrailingZeros().scale() > 0) {
            throw StockErrors.quantityMustBeWhole(field);
        }
        return quantity.stripTrailingZeros();
    }

    public static BigDecimal requireNotNegative(BigDecimal quantity, String unit, String field) {
        if (quantity != null && quantity.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return requirePositive(quantity, unit, field);
    }
}
