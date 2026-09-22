package com.stockhub.stock.domain.exception;

import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;

import java.math.BigDecimal;
import java.util.UUID;

public final class StockErrors {

    private StockErrors() {}

    public static BusinessRuleViolationException insufficientStock(
            String sku, BigDecimal available, BigDecimal requested) {
        return new BusinessRuleViolationException(
                "INSUFFICIENT_STOCK",
                "Insufficient stock for %s: %s available, %s requested.",
                sku,
                available.stripTrailingZeros().toPlainString(),
                requested.stripTrailingZeros().toPlainString());
    }

    public static BusinessRuleViolationException batchExpired(String batchNumber) {
        return new BusinessRuleViolationException(
                "BATCH_EXPIRED", "Batch %s has expired.", batchNumber);
    }

    public static InvalidInputException quantityInvalid(String field) {
        return new InvalidInputException(
                field,
                "QUANTITY_INVALID",
                "The quantity must be greater than zero, with at most 3 decimals.");
    }

    public static InvalidInputException quantityMustBeWhole(String field) {
        return new InvalidInputException(
                field, "QUANTITY_MUST_BE_WHOLE", "This unit only accepts whole quantities.");
    }

    public static ResourceNotFoundException batchNotFound(UUID id) {
        return new ResourceNotFoundException("Batch", id);
    }

    public static ResourceNotFoundException documentNotFound(UUID id) {
        return new ResourceNotFoundException("StockDocument", id);
    }
}
