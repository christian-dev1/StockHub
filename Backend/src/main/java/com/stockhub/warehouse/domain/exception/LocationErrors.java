package com.stockhub.warehouse.domain.exception;

import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import java.util.UUID;

public final class LocationErrors {

    private LocationErrors() {
    }

    public static ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("Location", id);
    }

    public static ConflictException codeAlreadyUsed() {
        return new ConflictException("LOCATION_CODE_ALREADY_EXISTS", "A location with this code already exists.");
    }
}
