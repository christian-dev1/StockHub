package com.stockhub.auth.domain.repository;

import com.stockhub.auth.domain.model.RefreshToken;
import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {

    void save(RefreshToken token);

    /** Loads and row-locks the token so two concurrent refreshes cannot both succeed. */
    Optional<RefreshToken> findByHashForUpdate(String tokenHash);

    void revokeFamily(UUID familyId, RevokeReason reason, Instant now);
}
