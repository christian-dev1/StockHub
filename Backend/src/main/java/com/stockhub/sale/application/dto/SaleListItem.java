package com.stockhub.sale.application.dto;

import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.SaleStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** One row of a sales list. */
public record SaleListItem(
        UUID id,
        String number,
        SaleStatus status,
        UUID locationId,
        String locationName,
        String sellerName,
        String customerName,
        PaymentMethod paymentMethod,
        String currency,
        BigDecimal totalAmount,
        int itemCount,
        Instant createdAt) {}
