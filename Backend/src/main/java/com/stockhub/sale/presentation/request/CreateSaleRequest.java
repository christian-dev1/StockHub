package com.stockhub.sale.presentation.request;

import com.stockhub.sale.application.command.CreateSaleCommand;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Body of POST /sales. Only products and quantities: any price sent by a client would be ignored,
 * so the schema has none.
 */
public record CreateSaleRequest(
        UUID locationId,
        @Schema(description = "Optional free text, at most 120 characters", nullable = true) String customerName,
        @Schema(allowableValues = {"CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER", "OTHER"}) String paymentMethod,
        List<Line> lines) {

    public record Line(UUID productId, BigDecimal quantity) {}

    public CreateSaleCommand toCommand(String idempotencyKey) {
        return new CreateSaleCommand(
                locationId,
                customerName,
                paymentMethod,
                lines == null
                        ? null
                        : lines.stream()
                                .map(l -> l == null ? null : new CreateSaleCommand.Line(l.productId(), l.quantity()))
                                .toList(),
                idempotencyKey);
    }
}
