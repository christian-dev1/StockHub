package com.stockhub.auth.infrastructure.persistence;

import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
class RefreshTokenJpaEntity {

    @Id
    UUID id;
    UUID userId;
    UUID familyId;
    String tokenHash;
    int tokenVersion;
    Instant issuedAt;
    Instant expiresAt;
    Instant revokedAt;
    @Enumerated(EnumType.STRING)
    RevokeReason revokeReason;
    UUID replacedBy;
    String createdIp;
    String userAgent;

    protected RefreshTokenJpaEntity() {
    }
}
