package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.model.ImportStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "import_jobs")
class ImportJobJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    String type;
    String fileName;
    @Enumerated(EnumType.STRING)
    ImportStatus status;
    int totalRows;
    int errorRows;
    boolean createMissingCategories;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    String rows;
    UUID userId;
    Instant expiresAt;
    Instant committedAt;
    @Version
    long version;

    protected ImportJobJpaEntity() {
    }
}
