package com.stockhub.stock.domain.service;

import com.stockhub.stock.domain.exception.StockErrors;
import com.stockhub.stock.domain.model.Batch;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Chooses the batches an outgoing quantity is taken from.
 *
 * <ul>
 *   <li>FEFO (first expired, first out) for batches with an expiry date;
 *   <li>batches without expiry come after them, oldest number first (FIFO-like);
 *   <li>expired and empty batches are never picked automatically.
 * </ul>
 */
public final class BatchAllocator {

    private static final Comparator<Batch> FEFO =
            Comparator.comparing(
                            Batch::expirationDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(Batch::batchNumber);

    private BatchAllocator() {}

    public record Allocation(Batch batch, BigDecimal quantity) {}

    /**
     * @throws com.stockhub.shared.domain.exception.BusinessRuleViolationException
     *     INSUFFICIENT_STOCK
     */
    public static List<Allocation> allocate(
            List<Batch> batches, BigDecimal requested, LocalDate today, String sku) {
        List<Batch> usable =
                batches.stream()
                        .filter(b -> b.quantity().signum() > 0 && !b.isExpired(today))
                        .sorted(FEFO)
                        .toList();
        BigDecimal available =
                usable.stream().map(Batch::quantity).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (available.compareTo(requested) < 0) {
            throw StockErrors.insufficientStock(sku, available, requested);
        }
        List<Allocation> allocations = new ArrayList<>();
        BigDecimal remaining = requested;
        for (Batch batch : usable) {
            if (remaining.signum() == 0) {
                break;
            }
            BigDecimal taken = batch.quantity().min(remaining);
            allocations.add(new Allocation(batch, taken));
            remaining = remaining.subtract(taken);
        }
        return List.copyOf(allocations);
    }
}
