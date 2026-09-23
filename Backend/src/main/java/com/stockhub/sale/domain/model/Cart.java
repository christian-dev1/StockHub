package com.stockhub.sale.domain.model;

import com.stockhub.sale.domain.exception.SaleErrors;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

/**
 * What the seller asks to sell: products and quantities only. Prices are never part of it, they
 * are read from the catalogue by the server.
 */
public record Cart(List<Item> items) {

    public static final int MAX_LINES = 100;

    public record Item(UUID productId, BigDecimal quantity) {}

    /** Validates the shape of the cart (stock availability is checked later, under lock). */
    public Cart {
        if (items == null || items.isEmpty()) {
            throw SaleErrors.emptyCart();
        }
        if (items.size() > MAX_LINES) {
            throw SaleErrors.tooManyLines(MAX_LINES);
        }
        var seen = new HashSet<UUID>();
        for (int i = 0; i < items.size(); i++) {
            Item item = items.get(i);
            String field = "lines[" + i + "]";
            if (item == null || item.productId() == null) {
                throw SaleErrors.productRequired(field + ".productId");
            }
            BigDecimal q = item.quantity();
            if (q == null
                    || q.signum() <= 0
                    || q.stripTrailingZeros().scale() > 3
                    || q.precision() - q.scale() > 16) {
                throw SaleErrors.quantityInvalid(field + ".quantity");
            }
            if (!seen.add(item.productId())) {
                throw SaleErrors.duplicateProduct(field + ".productId");
            }
        }
        items = List.copyOf(items);
    }

    public List<UUID> productIds() {
        return items.stream().map(Item::productId).toList();
    }
}
