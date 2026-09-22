package com.stockhub.stock.domain.model;

import com.stockhub.shared.domain.Ids;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Immutable line of the stock ledger. {@code previousQuantity} and {@code newQuantity} are the
 * stock level of the product in the location around this change, so the history can be replayed.
 */
public record StockMovement(
        UUID id,
        UUID companyId,
        UUID locationId,
        UUID productId,
        UUID batchId,
        UUID documentId,
        MovementType type,
        BigDecimal quantity,
        BigDecimal previousQuantity,
        BigDecimal newQuantity,
        String reason,
        String reference,
        UUID performedBy,
        Instant createdAt) {

    public StockMovement {
        Objects.requireNonNull(id);
        Objects.requireNonNull(companyId);
        Objects.requireNonNull(locationId);
        Objects.requireNonNull(productId);
        Objects.requireNonNull(documentId);
        Objects.requireNonNull(type);
        Objects.requireNonNull(performedBy);
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("A movement quantity is strictly positive");
        }
        Objects.requireNonNull(previousQuantity);
        Objects.requireNonNull(newQuantity);
    }

    public static StockMovement record(
            StockDocument document,
            StockLevel level,
            UUID batchId,
            MovementType type,
            BigDecimal quantity,
            StockLevel.Change change) {
        return new StockMovement(
                Ids.newId(),
                level.companyId(),
                level.locationId(),
                level.productId(),
                batchId,
                document.id(),
                type,
                quantity,
                change.previous(),
                change.current(),
                document.reason(),
                document.number(),
                document.performedBy(),
                document.createdAt());
    }
}
