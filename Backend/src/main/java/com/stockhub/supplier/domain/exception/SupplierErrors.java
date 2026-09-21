package com.stockhub.supplier.domain.exception;

import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import java.util.UUID;

public final class SupplierErrors {

    private SupplierErrors() {
    }

    public static ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("Supplier", id);
    }

    public static ConflictException codeAlreadyUsed() {
        return new ConflictException("SUPPLIER_CODE_ALREADY_EXISTS", "A supplier with this code already exists.");
    }
}
