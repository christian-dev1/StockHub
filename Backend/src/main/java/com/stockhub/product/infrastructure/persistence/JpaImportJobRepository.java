package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.model.ImportJob;
import com.stockhub.product.domain.repository.ImportJobRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Repository
class JpaImportJobRepository implements ImportJobRepository {

    private static final TypeReference<List<Map<String, String>>> ROWS = new TypeReference<>() {
    };

    private final ImportJobJpaRepository jpa;
    private final JsonMapper json;

    JpaImportJobRepository(ImportJobJpaRepository jpa, JsonMapper json) {
        this.jpa = jpa;
        this.json = json;
    }

    /** The version check makes two concurrent commits of the same job fail (409) instead of importing twice. */
    @Override
    public void save(ImportJob job) {
        ImportJobJpaEntity e = jpa.findById(job.id()).orElse(null);
        if (e == null) {
            e = new ImportJobJpaEntity();
            e.id = job.id();
            e.companyId = job.companyId();
            e.type = "PRODUCTS";
            e.fileName = job.fileName();
            e.totalRows = job.totalRows();
            e.errorRows = job.errorRows();
            e.createMissingCategories = job.createMissingCategories();
            e.rows = json.writeValueAsString(job.rows());
            e.userId = job.userId();
            e.expiresAt = job.expiresAt();
        } else if (e.version != job.version()) {
            throw new ObjectOptimisticLockingFailureException(ImportJobJpaEntity.class, job.id());
        }
        e.status = job.status();
        e.committedAt = job.committedAt();
        jpa.saveAndFlush(e);
    }

    @Override
    public Optional<ImportJob> findById(UUID companyId, UUID id) {
        return jpa.findByIdAndCompanyId(id, companyId).map(e -> new ImportJob(e.id, e.companyId, e.fileName,
                json.readValue(e.rows, ROWS), e.errorRows, e.createMissingCategories, e.userId, e.expiresAt,
                e.status, e.committedAt, e.version));
    }
}
