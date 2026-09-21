package com.stockhub.warehouse.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "locations")
class LocationJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    String code;
    String name;
    @Enumerated(EnumType.STRING)
    com.stockhub.warehouse.domain.model.LocationType type;
    String addressLine;
    String city;
    String phone;
    @Column(name = "is_primary")
    boolean primary;
    boolean active;
    Instant deletedAt;
    @Column(insertable = false, updatable = false)
    Instant createdAt;
    @Column(insertable = false, updatable = false)
    Instant updatedAt;
    @Version
    long version;

    protected LocationJpaEntity() {
    }
}
