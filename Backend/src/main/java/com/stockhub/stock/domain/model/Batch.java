package com.stockhub.stock.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.stock.domain.exception.StockErrors;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * A lot of a product in a location. Its quantity never goes below zero; a batch at zero is DEPLETED
 * and reactivated by a new entry of the same number.
 */
public final class Batch {

    public static final int MAX_NUMBER_LENGTH = 80;

    private final UUID id;
    private final UUID companyId;
    private final UUID locationId;
    private final UUID productId;
    private final String batchNumber;
    private BigDecimal quantity;
    private final LocalDate manufacturingDate;
    private final LocalDate expirationDate;
    private BatchStatus status;
    private final long version;

    public Batch(
            UUID id,
            UUID companyId,
            UUID locationId,
            UUID productId,
            String batchNumber,
            BigDecimal quantity,
            LocalDate manufacturingDate,
            LocalDate expirationDate,
            BatchStatus status,
            long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.locationId = Objects.requireNonNull(locationId);
        this.productId = Objects.requireNonNull(productId);
        this.batchNumber = validNumber(batchNumber);
        this.quantity = Objects.requireNonNull(quantity);
        this.manufacturingDate = manufacturingDate;
        this.expirationDate = expirationDate;
        if (manufacturingDate != null
                && expirationDate != null
                && manufacturingDate.isAfter(expirationDate)) {
            throw new InvalidInputException(
                    "manufacturingDate",
                    "BATCH_DATES_INVALID",
                    "The manufacturing date must precede the expiration date.");
        }
        this.status = Objects.requireNonNull(status);
        this.version = version;
    }

    /** A new, still empty batch; {@link #add} gives it its first quantity. */
    public static Batch open(
            UUID companyId,
            UUID locationId,
            UUID productId,
            String batchNumber,
            LocalDate manufacturingDate,
            LocalDate expirationDate) {
        return new Batch(
                Ids.newId(),
                companyId,
                locationId,
                productId,
                batchNumber,
                BigDecimal.ZERO,
                manufacturingDate,
                expirationDate,
                BatchStatus.DEPLETED,
                0);
    }

    public static String normalizeNumber(String value) {
        return value == null ? null : value.strip().toUpperCase(Locale.ROOT);
    }

    public ExpiryStatus expiryStatus(LocalDate today, int warningDays) {
        return ExpiryStatus.of(expirationDate, today, warningDays);
    }

    public boolean isExpired(LocalDate today) {
        return expirationDate != null && expirationDate.isBefore(today);
    }

    /** An incoming quantity must describe the same batch (same dates when they are given). */
    public boolean sameDates(LocalDate manufacturing, LocalDate expiration) {
        return (manufacturing == null || manufacturing.equals(manufacturingDate))
                && (expiration == null || expiration.equals(expirationDate));
    }

    public void add(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) throw StockErrors.quantityInvalid("quantity");
        quantity = quantity.add(amount);
        status = BatchStatus.ACTIVE;
    }

    /**
     * @throws com.stockhub.shared.domain.exception.BusinessRuleViolationException
     *     INSUFFICIENT_STOCK
     */
    public void remove(BigDecimal amount, String sku) {
        if (amount == null || amount.signum() <= 0) throw StockErrors.quantityInvalid("quantity");
        if (quantity.compareTo(amount) < 0) {
            throw StockErrors.insufficientStock(sku + " / " + batchNumber, quantity, amount);
        }
        quantity = quantity.subtract(amount);
        status = quantity.signum() == 0 ? BatchStatus.DEPLETED : BatchStatus.ACTIVE;
    }

    private static String validNumber(String value) {
        String number = normalizeNumber(value);
        if (number == null || number.isEmpty()) {
            throw new InvalidInputException(
                    "batchNumber", "BATCH_NUMBER_REQUIRED", "A batch number is required.");
        }
        if (number.length() > MAX_NUMBER_LENGTH) {
            throw new InvalidInputException(
                    "batchNumber", "BATCH_NUMBER_TOO_LONG", "The batch number is too long.");
        }
        return number;
    }

    public UUID id() {
        return id;
    }

    public UUID companyId() {
        return companyId;
    }

    public UUID locationId() {
        return locationId;
    }

    public UUID productId() {
        return productId;
    }

    public String batchNumber() {
        return batchNumber;
    }

    public BigDecimal quantity() {
        return quantity;
    }

    public LocalDate manufacturingDate() {
        return manufacturingDate;
    }

    public LocalDate expirationDate() {
        return expirationDate;
    }

    public BatchStatus status() {
        return status;
    }

    public long version() {
        return version;
    }
}
