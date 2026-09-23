package com.stockhub.sale.application.dto;

import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.SaleStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** A sale with everything a receipt shows. */
public record SaleView(
        UUID id,
        String number,
        SaleStatus status,
        UUID locationId,
        String locationName,
        UUID sellerId,
        String sellerName,
        String customerName,
        PaymentMethod paymentMethod,
        String currency,
        BigDecimal totalAmount,
        String stockDocumentNumber,
        Instant createdAt,
        List<Line> lines) {

    public record Line(
            int position,
            UUID productId,
            String productName,
            String sku,
            String unit,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {}
}
