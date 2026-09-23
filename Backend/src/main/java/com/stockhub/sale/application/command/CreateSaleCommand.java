package com.stockhub.sale.application.command;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * A sale as submitted by the point of sale: no price nor total, the server computes them.
 *
 * @param idempotencyKey optional client key; a retried submission returns the original sale
 */
public record CreateSaleCommand(
        UUID locationId,
        String customerName,
        String paymentMethod,
        List<Line> lines,
        String idempotencyKey) {

    public record Line(UUID productId, BigDecimal quantity) {}
}
