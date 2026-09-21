package com.stockhub.auth.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.stockhub.auth.domain.model.RefreshToken;
import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RefreshTokenTest {

    private final Instant now = Instant.parse("2026-09-21T10:00:00Z");

    @Test
    void rotationKeepsTheFamilyAndRevokesThePreviousToken() {
        RefreshToken first = RefreshToken.issue(UUID.randomUUID(), "h1", 3, now, Duration.ofDays(7), "1.1.1.1", "ua");
        RefreshToken second = first.rotate("h2", 3, now.plusSeconds(60), Duration.ofDays(7), "1.1.1.1", "ua");

        assertThat(second.familyId()).isEqualTo(first.familyId());
        assertThat(first.isRevoked()).isTrue();
        assertThat(first.revokeReason()).isEqualTo(RevokeReason.ROTATED);
        assertThat(first.replacedBy()).isEqualTo(second.id());
        assertThat(second.isRevoked()).isFalse();
    }

    @Test
    void expiresAtTheEndOfItsLifetime() {
        RefreshToken token = RefreshToken.issue(UUID.randomUUID(), "h", 0, now, Duration.ofDays(7), null, null);
        assertThat(token.isExpired(now.plus(Duration.ofDays(7)).minusSeconds(1))).isFalse();
        assertThat(token.isExpired(now.plus(Duration.ofDays(7)))).isTrue();
    }

    @Test
    void firstRevocationReasonWins() {
        RefreshToken token = RefreshToken.issue(UUID.randomUUID(), "h", 0, now, Duration.ofDays(7), null, null);
        token.revoke(RevokeReason.LOGOUT, now);
        token.revoke(RevokeReason.REUSE_DETECTED, now.plusSeconds(1));
        assertThat(token.revokeReason()).isEqualTo(RevokeReason.LOGOUT);
    }
}
