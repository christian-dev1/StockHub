package com.stockhub.stock.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

/** Persisted document line associated with an immutable ledger movement. */
public record StockDocumentLine(
        UUID id,
        UUID documentId,
        UUID productId,
        UUID batchId,
        BigDecimal quantity,
        BigDecimal previousQuantity,
        BigDecimal newQuantity,
        UUID movementId) {}
