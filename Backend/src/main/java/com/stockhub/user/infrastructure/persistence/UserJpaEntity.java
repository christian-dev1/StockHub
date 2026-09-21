package com.stockhub.user.infrastructure.persistence;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.UserStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
class UserJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    String email;
    String passwordHash;
    String firstName;
    String lastName;
    String phone;
    @Enumerated(EnumType.STRING)
    RoleCode role;
    boolean allLocations;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_locations", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "location_id")
    Set<UUID> locationIds = new HashSet<>();
    @Enumerated(EnumType.STRING)
    UserStatus status;
    boolean mustChangePassword;
    int tokenVersion;
    Instant lastLoginAt;
    Instant deletedAt;
    @Column(insertable = false, updatable = false)
    Instant createdAt;
    @Version
    long version;

    protected UserJpaEntity() {
    }
}
