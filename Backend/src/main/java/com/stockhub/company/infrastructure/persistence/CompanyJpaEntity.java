package com.stockhub.company.infrastructure.persistence;

import com.stockhub.company.domain.model.CompanyStatus;
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
@Table(name = "companies")
class CompanyJpaEntity {

    @Id
    UUID id;
    String name;
    String legalName;
    String email;
    String phone;
    String addressLine;
    String city;
    String country;
    String currency;
    String timezone;
    String locale;
    @Enumerated(EnumType.STRING)
    CompanyStatus status;
    boolean allowNegativeStock;
    int expiryWarningDays;
    int defaultLeadTimeDays;
    @Column(insertable = false, updatable = false)
    Instant createdAt;
    @Version
    long version;

    protected CompanyJpaEntity() {
    }
}
