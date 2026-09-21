package com.stockhub.auth.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.auth.application.dto.SessionTokens;
import com.stockhub.auth.application.port.OpaqueTokenGenerator;
import com.stockhub.auth.domain.exception.AuthErrors;
import com.stockhub.auth.domain.model.RefreshToken;
import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import com.stockhub.auth.domain.repository.RefreshTokenRepository;
import com.stockhub.shared.domain.exception.DomainException;
import com.stockhub.user.UserAuthorities;
import com.stockhub.user.UserDirectory;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Exchanges a refresh token for a new token pair (rotation). Revocations made
 * while refusing a refresh are committed even though the call fails.
 */
@Service
public class RefreshSessionUseCase {

    private final RefreshTokenRepository refreshTokens;
    private final OpaqueTokenGenerator opaqueTokens;
    private final UserDirectory users;
    private final AccountEligibility eligibility;
    private final SessionIssuer sessions;
    private final AuditRecorder audit;

    RefreshSessionUseCase(RefreshTokenRepository refreshTokens, OpaqueTokenGenerator opaqueTokens,
                          UserDirectory users, AccountEligibility eligibility, SessionIssuer sessions,
                          AuditRecorder audit) {
        this.refreshTokens = refreshTokens;
        this.opaqueTokens = opaqueTokens;
        this.users = users;
        this.eligibility = eligibility;
        this.sessions = sessions;
        this.audit = audit;
    }

    @Transactional(noRollbackFor = DomainException.class)
    public SessionTokens execute(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw AuthErrors.invalidRefreshToken();
        }
        RefreshToken token = refreshTokens.findByHashForUpdate(opaqueTokens.hash(rawRefreshToken))
                .orElseThrow(AuthErrors::invalidRefreshToken);
        if (token.isRevoked()) {
            if (token.revokeReason() == RevokeReason.ROTATED) {
                refreshTokens.revokeFamily(token.familyId(), RevokeReason.REUSE_DETECTED, sessions.now());
                audit.recordIndependently(AuditEntry.of("REFRESH_TOKEN_REUSE_DETECTED", "User", token.userId())
                        .withMetadata(Map.of("familyId", token.familyId())));
            }
            throw AuthErrors.invalidRefreshToken();
        }
        if (token.isExpired(sessions.now())) {
            throw AuthErrors.invalidRefreshToken();
        }
        UserAuthorities user = users.loadAuthorities(token.userId()).orElse(null);
        if (user == null || user.tokenVersion() != token.tokenVersion()) {
            refreshTokens.revokeFamily(token.familyId(), RevokeReason.ACCOUNT_CHANGED, sessions.now());
            throw AuthErrors.invalidRefreshToken();
        }
        try {
            eligibility.require(user);
        } catch (DomainException refused) {
            refreshTokens.revokeFamily(token.familyId(), RevokeReason.ACCOUNT_CHANGED, sessions.now());
            throw refused;
        }
        return sessions.rotate(token, user);
    }
}
