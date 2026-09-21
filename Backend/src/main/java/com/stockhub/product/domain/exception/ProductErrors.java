package com.stockhub.product.domain.exception;

import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import java.util.UUID;

public final class ProductErrors {

    private ProductErrors() {
    }

    public static ResourceNotFoundException notFound(Object id) {
        return new ResourceNotFoundException("Product", id);
    }

    public static ResourceNotFoundException categoryNotFound(UUID id) {
        return new ResourceNotFoundException("Category", id);
    }

    public static ConflictException skuAlreadyUsed() {
        return new ConflictException("PRODUCT_SKU_ALREADY_EXISTS", "A product with this SKU already exists.");
    }

    public static ConflictException barcodeAlreadyUsed() {
        return new ConflictException("PRODUCT_BARCODE_ALREADY_EXISTS", "Another product already uses this barcode.");
    }

    public static ConflictException categoryNameAlreadyUsed() {
        return new ConflictException("CATEGORY_NAME_ALREADY_EXISTS", "A category with this name already exists.");
    }

    public static InvalidInputException unknownCategory() {
        return new InvalidInputException("categoryId", "PRODUCT_CATEGORY_UNKNOWN", "This category does not exist.");
    }

    public static InvalidInputException unknownSupplier() {
        return new InvalidInputException("defaultSupplierId", "PRODUCT_SUPPLIER_UNKNOWN",
                "This supplier does not exist or is inactive.");
    }

    public static BusinessRuleViolationException categoryInUse() {
        return new BusinessRuleViolationException("CATEGORY_IN_USE",
                "This category still has products or sub-categories.");
    }
}
