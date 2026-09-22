package com.stockhub.stock.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.stock.domain.exception.StockErrors;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

/**
 * Quantity of a product held in a location; unique per company, location and product. It only
 * changes through {@link #apply}, which also returns the balances written to the movement ledger.
 */
public final class StockLevel {

    private final UUID id;
    private final UUID companyId;
    private final UUID locationId;
    private final UUID productId;
    private BigDecimal quantity;
    private final long version;

    public StockLevel(
            UUID id,
            UUID companyId,
            UUID locationId,
            UUID productId,
            BigDecimal quantity,
            long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.locationId = Objects.requireNonNull(locationId);
        this.productId = Objects.requireNonNull(productId);
        this.quantity = Objects.requireNonNull(quantity);
        this.version = version;
    }

    public static StockLevel empty(UUID companyId, UUID locationId, UUID productId) {
        return new StockLevel(Ids.newId(), companyId, locationId, productId, BigDecimal.ZERO, 0);
    }

    /** Balances around one change of this level. */
    public record Change(BigDecimal previous, BigDecimal current) {}

    /**
     * Adds or removes {@code quantity}. A removal that would go below zero is refused unless {@code
     * allowNegative} (company setting).
     *
     * @throws com.stockhub.shared.domain.exception.BusinessRuleViolationException
     *     INSUFFICIENT_STOCK
     */
    public Change apply(MovementType type, BigDecimal amount, boolean allowNegative, String sku) {
        if (amount == null || amount.signum() <= 0) {
            throw StockErrors.quantityInvalid("quantity");
        }
        BigDecimal previous = quantity;
        BigDecimal next = type.increases() ? previous.add(amount) : previous.subtract(amount);
        if (next.signum() < 0 && !allowNegative) {
            throw StockErrors.insufficientStock(sku, previous.max(BigDecimal.ZERO), amount);
        }
        quantity = next;
        return new Change(previous, next);
    }

    public UUID id() {
        return id;
    }

    public UUID companyId() {
        return companyId;
    }

    public UUID locationId() {
        return locationId;
    }

    public UUID productId() {
        return productId;
    }

    public BigDecimal quantity() {
        return quantity;
    }

    public long version() {
        return version;
    }
}
