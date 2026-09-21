package com.stockhub.auth.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.auth.application.dto.SessionTokens;
import com.stockhub.auth.application.port.LoginAttemptLimiter;
import com.stockhub.auth.domain.exception.AuthErrors;
import com.stockhub.shared.application.RequestMetadataProvider;
import com.stockhub.shared.domain.exception.DomainException;
import com.stockhub.user.UserAuthorities;
import com.stockhub.user.UserDirectory;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginUseCase {

    private final UserDirectory users;
    private final AccountEligibility eligibility;
    private final SessionIssuer sessions;
    private final LoginAttemptLimiter limiter;
    private final RequestMetadataProvider requestMetadata;
    private final AuditRecorder audit;

    LoginUseCase(UserDirectory users, AccountEligibility eligibility, SessionIssuer sessions,
                 LoginAttemptLimiter limiter, RequestMetadataProvider requestMetadata, AuditRecorder audit) {
        this.users = users;
        this.eligibility = eligibility;
        this.sessions = sessions;
        this.limiter = limiter;
        this.requestMetadata = requestMetadata;
        this.audit = audit;
    }

    @Transactional
    public SessionTokens execute(String email, String password) {
        String normalizedEmail = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
        String limiterKey = normalizedEmail + "|" + requestMetadata.current().ipAddress();
        if (limiter.isBlocked(limiterKey)) {
            throw AuthErrors.tooManyAttempts();
        }
        Optional<UUID> userId = users.verifyCredentials(normalizedEmail, password);
        if (userId.isEmpty()) {
            fail(limiterKey, normalizedEmail, null, "BAD_CREDENTIALS");
            throw AuthErrors.invalidCredentials();
        }
        UserAuthorities user = users.loadAuthorities(userId.get()).orElseThrow(AuthErrors::invalidCredentials);
        try {
            eligibility.require(user);
        } catch (DomainException refused) {
            fail(limiterKey, normalizedEmail, user, refused.code());
            throw refused;
        }
        limiter.reset(limiterKey);
        users.recordSuccessfulLogin(user.userId());
        audit.record(AuditEntry.of("LOGIN_SUCCEEDED", "User", user.userId()).inCompany(user.companyId()));
        return sessions.startSession(user);
    }

    private void fail(String limiterKey, String email, UserAuthorities user, String reason) {
        limiter.recordFailure(limiterKey);
        audit.recordIndependently(AuditEntry.of("LOGIN_FAILED", "User", user == null ? null : user.userId())
                .inCompany(user == null ? null : user.companyId())
                .withMetadata(Map.of("email", email, "reason", reason)));
    }
}
