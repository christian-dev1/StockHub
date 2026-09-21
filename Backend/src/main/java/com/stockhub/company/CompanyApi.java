package com.stockhub.company;

import java.util.Optional;
import java.util.UUID;

public interface CompanyApi {

    Optional<CompanySnapshot> find(UUID companyId);

    /** Cached: called on every authenticated request. */
    boolean isActive(UUID companyId);
}
