package com.stockhub.sale.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.Texts;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * A completed point-of-sale sale. Immutable once recorded: its total is the sum of its lines and
 * the seller name, currency and line details are snapshots for receipts.
 *
 * @param customerName optional free text (there is no customer master)
 * @param stockDocumentId goods-issued note produced by the stock engine
 * @param idempotencyKey client key of the submission, optional
 */
public record Sale(
        UUID id,
        UUID companyId,
        UUID locationId,
        String number,
        SaleStatus status,
        UUID sellerId,
        String sellerName,
        String customerName,
        PaymentMethod paymentMethod,
        String currency,
        BigDecimal totalAmount,
        UUID stockDocumentId,
        String idempotencyKey,
        Instant createdAt,
        List<SaleLine> lines) {

    public static final int CUSTOMER_NAME_MAX = 120;

    public Sale {
        Objects.requireNonNull(id);
        Objects.requireNonNull(companyId);
        Objects.requireNonNull(locationId);
        Objects.requireNonNull(number);
        Objects.requireNonNull(status);
        Objects.requireNonNull(sellerId);
        Objects.requireNonNull(sellerName);
        Objects.requireNonNull(paymentMethod);
        Objects.requireNonNull(currency);
        Objects.requireNonNull(stockDocumentId);
        Objects.requireNonNull(createdAt);
        lines = List.copyOf(lines);
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("A sale has at least one line.");
        }
        customerName = Texts.optional(customerName, "customerName", CUSTOMER_NAME_MAX);
        BigDecimal sum = lines.stream().map(SaleLine::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalAmount == null || totalAmount.compareTo(sum) != 0) {
            throw new IllegalArgumentException("The total of a sale is the sum of its lines.");
        }
    }

    /** Records a new completed sale; the total is computed from the lines. */
    public static Sale complete(
            UUID companyId,
            UUID locationId,
            String number,
            UUID sellerId,
            String sellerName,
            String customerName,
            PaymentMethod paymentMethod,
            String currency,
            UUID stockDocumentId,
            String idempotencyKey,
            Instant now,
            List<SaleLine> lines) {
        BigDecimal total = lines.stream().map(SaleLine::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Sale(
                Ids.newId(),
                companyId,
                locationId,
                number,
                SaleStatus.COMPLETED,
                sellerId,
                sellerName,
                customerName,
                paymentMethod,
                currency,
                total,
                stockDocumentId,
                idempotencyKey,
                now,
                lines);
    }
}
