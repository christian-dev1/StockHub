package com.stockhub.sale.domain.exception;

import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;

import java.util.UUID;

/** Stable error codes of the sales module (translated by the frontends). */
public final class SaleErrors {

    private SaleErrors() {}

    public static InvalidInputException emptyCart() {
        return new InvalidInputException("lines", "SALE_EMPTY", "A sale needs at least one product.");
    }

    public static InvalidInputException tooManyLines(int max) {
        return new InvalidInputException(
                "lines", "SALE_TOO_MANY_LINES", "A sale has at most %s lines.", max);
    }

    public static InvalidInputException productRequired(String field) {
        return new InvalidInputException(field, "PRODUCT_REQUIRED", "A product is required.");
    }

    public static InvalidInputException quantityInvalid(String field) {
        return new InvalidInputException(
                field,
                "QUANTITY_INVALID",
                "The quantity must be greater than zero, with at most 3 decimals.");
    }

    public static InvalidInputException duplicateProduct(String field) {
        return new InvalidInputException(
                field, "SALE_DUPLICATE_PRODUCT", "Each product appears only once in a sale.");
    }

    public static InvalidInputException paymentMethodInvalid() {
        return new InvalidInputException(
                "paymentMethod", "SALE_PAYMENT_METHOD_INVALID", "Choose a valid payment method.");
    }

    public static InvalidInputException idempotencyKeyInvalid() {
        return new InvalidInputException(
                "Idempotency-Key", "IDEMPOTENCY_KEY_INVALID", "The idempotency key is invalid.");
    }

    public static BusinessRuleViolationException productInactive(String sku) {
        return new BusinessRuleViolationException(
                "PRODUCT_INACTIVE", "Product %s is inactive and cannot be sold.", sku);
    }

    public static ConflictException idempotencyKeyReused() {
        return new ConflictException(
                "IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used by someone else.");
    }

    public static ResourceNotFoundException saleNotFound(UUID id) {
        return new ResourceNotFoundException("Sale", id);
    }
}
