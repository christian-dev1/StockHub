package com.stockhub.auth.infrastructure.persistence;

import com.stockhub.auth.domain.model.RefreshToken;
import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import com.stockhub.auth.domain.repository.RefreshTokenRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
class JpaRefreshTokenRepository implements RefreshTokenRepository {

    private final RefreshTokenJpaRepository jpa;

    JpaRefreshTokenRepository(RefreshTokenJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(RefreshToken token) {
        RefreshTokenJpaEntity e = jpa.findById(token.id()).orElseGet(RefreshTokenJpaEntity::new);
        e.id = token.id();
        e.userId = token.userId();
        e.familyId = token.familyId();
        e.tokenHash = token.tokenHash();
        e.tokenVersion = token.tokenVersion();
        e.issuedAt = token.issuedAt();
        e.expiresAt = token.expiresAt();
        e.revokedAt = token.revokedAt();
        e.revokeReason = token.revokeReason();
        e.replacedBy = token.replacedBy();
        e.createdIp = token.createdIp();
        e.userAgent = token.userAgent();
        jpa.save(e);
    }

    @Override
    public Optional<RefreshToken> findByHashForUpdate(String tokenHash) {
        return jpa.findByHashForUpdate(tokenHash).map(e -> new RefreshToken(e.id, e.userId, e.familyId, e.tokenHash,
                e.tokenVersion, e.issuedAt, e.expiresAt, e.revokedAt, e.revokeReason, e.replacedBy, e.createdIp,
                e.userAgent));
    }

    @Override
    public void revokeFamily(UUID familyId, RevokeReason reason, Instant now) {
        jpa.revokeFamily(familyId, reason, now);
    }
}
