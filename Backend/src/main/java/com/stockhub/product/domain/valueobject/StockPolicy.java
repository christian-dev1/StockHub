package com.stockhub.product.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.math.BigDecimal;

/**
 * Replenishment thresholds of a product.
 *
 * @param minStock         low-stock alert threshold (0 disables the alert)
 * @param reorderQuantity  preferred order quantity, or {@code null} to let the forecast decide
 */
public record StockPolicy(BigDecimal minStock, BigDecimal reorderQuantity) {

    public static final StockPolicy NONE = new StockPolicy(BigDecimal.ZERO, null);

    public StockPolicy {
        minStock = minStock == null ? BigDecimal.ZERO : minStock;
        if (minStock.signum() < 0) {
            throw new InvalidInputException("minStock", "PRODUCT_MIN_STOCK_NEGATIVE", "Minimum stock cannot be negative.");
        }
        requireQuantityScale(minStock, "minStock");
        if (reorderQuantity != null) {
            if (reorderQuantity.signum() <= 0) {
                throw new InvalidInputException("reorderQuantity", "PRODUCT_REORDER_QUANTITY_INVALID",
                        "Reorder quantity must be positive.");
            }
            requireQuantityScale(reorderQuantity, "reorderQuantity");
        }
    }

    private static void requireQuantityScale(BigDecimal value, String field) {
        if (value.stripTrailingZeros().scale() > 3 || value.precision() - value.scale() > 16) {
            throw new InvalidInputException(field, "QUANTITY_INVALID", "Quantity has too many digits.");
        }
    }
}
