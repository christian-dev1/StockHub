package com.stockhub.stock.application.command;

import com.stockhub.stock.domain.model.MovementType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Inputs of the stock use cases. */
public final class StockCommands {

    private StockCommands() {}

    /**
     * Goods received; batch fields are only used (and then required) for batch-tracked products.
     */
    public record EntryLine(
            UUID productId,
            BigDecimal quantity,
            String batchNumber,
            LocalDate manufacturingDate,
            LocalDate expirationDate) {}

    /**
     * @param type ENTRY (default) or RETURN_CUSTOMER
     */
    public record Entry(
            UUID locationId,
            MovementType type,
            String reason,
            String reference,
            List<EntryLine> lines) {}

    /**
     * @param batchId imposes a batch; without it batches are picked FEFO
     */
    public record OutLine(UUID productId, BigDecimal quantity, UUID batchId) {}

    /**
     * @param type EXIT (default) or RETURN_SUPPLIER
     */
    public record Exit(
            UUID locationId,
            MovementType type,
            String reason,
            String reference,
            List<OutLine> lines) {}

    /**
     * Brings the stock (or one batch) to the quantity actually counted.
     *
     * @param batchId required for batch-tracked products
     */
    public record Adjustment(
            UUID locationId,
            UUID productId,
            UUID batchId,
            BigDecimal countedQuantity,
            String reason) {}

    public record Transfer(
            UUID sourceLocationId,
            UUID destinationLocationId,
            String reason,
            String reference,
            List<OutLine> lines) {}
}
