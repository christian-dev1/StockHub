package com.stockhub.supplier.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "suppliers")
class SupplierJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    String code;
    String name;
    String contactName;
    String email;
    String phone;
    String addressLine;
    String city;
    String country;
    String taxId;
    Integer leadTimeDays;
    String notes;
    boolean active;
    Instant deletedAt;
    @Column(insertable = false, updatable = false)
    Instant createdAt;
    @Version
    long version;

    protected SupplierJpaEntity() {
    }
}
