package com.stockhub.stock.application.dto;

import com.stockhub.stock.domain.model.DocumentType;
import com.stockhub.stock.domain.model.ExpiryStatus;
import com.stockhub.stock.domain.model.MovementType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Read models returned by the stock queries and use cases. */
public final class StockViews {

    private StockViews() {}

    public record ProductRef(UUID id, String sku, String name, String unit) {}

    public record LocationRef(UUID id, String code, String name) {}

    /**
     * @param lowStock quantity at or below the product minimum stock (minimum above zero)
     */
    public record Level(
            ProductRef product,
            LocationRef location,
            BigDecimal quantity,
            BigDecimal minStock,
            boolean lowStock,
            Instant updatedAt) {}

    public record BatchView(
            UUID id,
            ProductRef product,
            LocationRef location,
            String batchNumber,
            BigDecimal quantity,
            LocalDate manufacturingDate,
            LocalDate expirationDate,
            ExpiryStatus expiryStatus,
            Long daysToExpiry,
            String status) {}

    public record Movement(
            UUID id,
            MovementType type,
            ProductRef product,
            LocationRef location,
            UUID batchId,
            String batchNumber,
            BigDecimal quantity,
            BigDecimal previousQuantity,
            BigDecimal newQuantity,
            String reason,
            String reference,
            UUID documentId,
            UUID performedBy,
            Instant createdAt) {}

    public record Document(
            UUID id,
            DocumentType type,
            String number,
            LocationRef location,
            LocationRef destination,
            String reason,
            String reference,
            UUID performedBy,
            String performedByName,
            Instant createdAt,
            List<Movement> lines) {}
}
