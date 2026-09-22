package com.stockhub.stock.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.Texts;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Stock note (goods received, goods issued, adjustment, transfer). Immutable once created; its
 * lines are the movements referencing it.
 *
 * @param reference external reference (supplier delivery note, customer…), optional
 */
public record StockDocument(
        UUID id,
        UUID companyId,
        DocumentType type,
        String number,
        UUID locationId,
        UUID destinationLocationId,
        String reason,
        String reference,
        UUID performedBy,
        String performedByName,
        Instant createdAt) {

    public StockDocument {
        Objects.requireNonNull(id);
        Objects.requireNonNull(companyId);
        Objects.requireNonNull(type);
        Objects.requireNonNull(number);
        Objects.requireNonNull(locationId);
        Objects.requireNonNull(performedBy);
        Objects.requireNonNull(performedByName);
        Objects.requireNonNull(createdAt);
        reason = Texts.optional(reason, "reason", 500);
        reference = Texts.optional(reference, "reference", 100);
    }

    public static StockDocument create(
            UUID companyId,
            DocumentType type,
            String number,
            UUID locationId,
            UUID destinationLocationId,
            String reason,
            String reference,
            UUID performedBy,
            String performedByName,
            Instant now) {
        return new StockDocument(
                Ids.newId(),
                companyId,
                type,
                number,
                locationId,
                destinationLocationId,
                reason,
                reference,
                performedBy,
                performedByName,
                now);
    }
}
