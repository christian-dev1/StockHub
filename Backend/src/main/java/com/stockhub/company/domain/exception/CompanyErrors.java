package com.stockhub.company.domain.exception;

import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import java.util.UUID;

public final class CompanyErrors {

    private CompanyErrors() {
    }

    public static ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("Company", id);
    }

    public static ConflictException nameAlreadyUsed() {
        return new ConflictException("COMPANY_NAME_ALREADY_EXISTS", "A company with this name already exists.");
    }
}
