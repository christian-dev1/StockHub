package com.stockhub.auth.domain.model;

import com.stockhub.shared.domain.Ids;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Opaque refresh token (only its SHA-256 hash is stored). Tokens of one login
 * form a family; each refresh rotates the token, and presenting an already
 * rotated token reveals theft, which revokes the whole family.
 */
public final class RefreshToken {

    private final UUID id;
    private final UUID userId;
    private final UUID familyId;
    private final String tokenHash;
    private final int tokenVersion;
    private final Instant issuedAt;
    private final Instant expiresAt;
    private Instant revokedAt;
    private RevokeReason revokeReason;
    private UUID replacedBy;
    private final String createdIp;
    private final String userAgent;

    public enum RevokeReason { ROTATED, LOGOUT, REUSE_DETECTED, ACCOUNT_CHANGED }

    public RefreshToken(UUID id, UUID userId, UUID familyId, String tokenHash, int tokenVersion, Instant issuedAt,
                        Instant expiresAt, Instant revokedAt, RevokeReason revokeReason, UUID replacedBy,
                        String createdIp, String userAgent) {
        this.id = Objects.requireNonNull(id);
        this.userId = Objects.requireNonNull(userId);
        this.familyId = Objects.requireNonNull(familyId);
        this.tokenHash = Objects.requireNonNull(tokenHash);
        this.tokenVersion = tokenVersion;
        this.issuedAt = Objects.requireNonNull(issuedAt);
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.revokedAt = revokedAt;
        this.revokeReason = revokeReason;
        this.replacedBy = replacedBy;
        this.createdIp = createdIp;
        this.userAgent = userAgent;
    }

    public static RefreshToken issue(UUID userId, String tokenHash, int tokenVersion, Instant now, Duration ttl,
                                     String ip, String userAgent) {
        return new RefreshToken(Ids.newId(), userId, Ids.newId(), tokenHash, tokenVersion, now, now.plus(ttl),
                null, null, null, ip, userAgent);
    }

    /** Next token of the same family; this one becomes revoked (ROTATED). */
    public RefreshToken rotate(String newHash, int currentTokenVersion, Instant now, Duration ttl, String ip,
                               String agent) {
        RefreshToken next = new RefreshToken(Ids.newId(), userId, familyId, newHash, currentTokenVersion, now,
                now.plus(ttl), null, null, null, ip, agent);
        revoke(RevokeReason.ROTATED, now);
        this.replacedBy = next.id;
        return next;
    }

    public void revoke(RevokeReason reason, Instant now) {
        if (revokedAt == null) {
            revokedAt = now;
            revokeReason = reason;
        }
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    public UUID id() { return id; }
    public UUID userId() { return userId; }
    public UUID familyId() { return familyId; }
    public String tokenHash() { return tokenHash; }
    public int tokenVersion() { return tokenVersion; }
    public Instant issuedAt() { return issuedAt; }
    public Instant expiresAt() { return expiresAt; }
    public Instant revokedAt() { return revokedAt; }
    public RevokeReason revokeReason() { return revokeReason; }
    public UUID replacedBy() { return replacedBy; }
    public String createdIp() { return createdIp; }
    public String userAgent() { return userAgent; }
}
