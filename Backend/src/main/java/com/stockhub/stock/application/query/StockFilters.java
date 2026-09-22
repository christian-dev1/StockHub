package com.stockhub.stock.application.query;

import com.stockhub.stock.domain.model.DocumentType;
import com.stockhub.stock.domain.model.ExpiryStatus;
import com.stockhub.stock.domain.model.MovementType;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Filters of the stock read side. {@code allowedLocations} is null for users granted every
 * location, otherwise the set they may see.
 */
public final class StockFilters {

    private StockFilters() {}

    public record Levels(
            Set<UUID> allowedLocations, UUID locationId, UUID productId, boolean includeZero) {}

    public record Movements(
            Set<UUID> allowedLocations,
            UUID locationId,
            UUID productId,
            MovementType type,
            UUID documentId,
            Instant from,
            Instant to) {}

    public record Batches(
            Set<UUID> allowedLocations,
            UUID locationId,
            UUID productId,
            ExpiryStatus expiryStatus,
            boolean includeDepleted) {}

    public record Documents(Set<UUID> allowedLocations, DocumentType type, UUID locationId) {}
}
