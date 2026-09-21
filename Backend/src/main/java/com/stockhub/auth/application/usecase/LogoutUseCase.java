package com.stockhub.auth.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.auth.application.port.OpaqueTokenGenerator;
import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import com.stockhub.auth.domain.repository.RefreshTokenRepository;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Revokes the whole refresh token family of the presented token. Idempotent. */
@Service
public class LogoutUseCase {

    private final RefreshTokenRepository refreshTokens;
    private final OpaqueTokenGenerator opaqueTokens;
    private final AuditRecorder audit;
    private final Clock clock;

    LogoutUseCase(RefreshTokenRepository refreshTokens, OpaqueTokenGenerator opaqueTokens, AuditRecorder audit,
                  Clock clock) {
        this.refreshTokens = refreshTokens;
        this.opaqueTokens = opaqueTokens;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public void execute(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokens.findByHashForUpdate(opaqueTokens.hash(rawRefreshToken)).ifPresent(token -> {
            refreshTokens.revokeFamily(token.familyId(), RevokeReason.LOGOUT, Instant.now(clock));
            audit.record(AuditEntry.of("LOGOUT", "User", token.userId()));
        });
    }
}
