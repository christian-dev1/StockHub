package com.stockhub.product.domain.repository;

import com.stockhub.product.domain.model.ImportJob;
import java.util.Optional;
import java.util.UUID;

public interface ImportJobRepository {

    void save(ImportJob job);

    Optional<ImportJob> findById(UUID companyId, UUID id);
}
