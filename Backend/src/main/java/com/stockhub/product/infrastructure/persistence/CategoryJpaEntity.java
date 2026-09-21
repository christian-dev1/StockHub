package com.stockhub.product.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
class CategoryJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    String name;
    String description;
    UUID parentId;
    boolean active;
    Instant deletedAt;
    @Column(insertable = false, updatable = false)
    Instant createdAt;
    @Version
    long version;

    protected CategoryJpaEntity() {
    }
}
