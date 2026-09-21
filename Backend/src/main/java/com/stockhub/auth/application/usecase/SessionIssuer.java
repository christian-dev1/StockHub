package com.stockhub.auth.application.usecase;

import com.stockhub.auth.application.dto.SessionTokens;
import com.stockhub.auth.application.port.AccessTokenIssuer;
import com.stockhub.auth.application.port.OpaqueTokenGenerator;
import com.stockhub.auth.domain.model.RefreshToken;
import com.stockhub.auth.domain.repository.RefreshTokenRepository;
import com.stockhub.shared.application.RequestMetadata;
import com.stockhub.shared.application.RequestMetadataProvider;
import com.stockhub.user.UserAuthorities;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Component;

@Component
class SessionIssuer {

    private final AccessTokenIssuer accessTokens;
    private final OpaqueTokenGenerator opaqueTokens;
    private final RefreshTokenRepository refreshTokens;
    private final RequestMetadataProvider requestMetadata;
    private final AuthSettings settings;
    private final Clock clock;

    SessionIssuer(AccessTokenIssuer accessTokens, OpaqueTokenGenerator opaqueTokens,
                  RefreshTokenRepository refreshTokens, RequestMetadataProvider requestMetadata,
                  AuthSettings settings, Clock clock) {
        this.accessTokens = accessTokens;
        this.opaqueTokens = opaqueTokens;
        this.refreshTokens = refreshTokens;
        this.requestMetadata = requestMetadata;
        this.settings = settings;
        this.clock = clock;
    }

    SessionTokens startSession(UserAuthorities user) {
        String raw = opaqueTokens.generate();
        RequestMetadata request = requestMetadata.current();
        refreshTokens.save(RefreshToken.issue(user.userId(), opaqueTokens.hash(raw), user.tokenVersion(), now(),
                settings.refreshTokenTtl(), request.ipAddress(), request.userAgent()));
        return tokens(user, raw);
    }

    SessionTokens rotate(RefreshToken current, UserAuthorities user) {
        String raw = opaqueTokens.generate();
        RequestMetadata request = requestMetadata.current();
        RefreshToken next = current.rotate(opaqueTokens.hash(raw), user.tokenVersion(), now(),
                settings.refreshTokenTtl(), request.ipAddress(), request.userAgent());
        refreshTokens.save(next);
        refreshTokens.save(current);
        return tokens(user, raw);
    }

    private SessionTokens tokens(UserAuthorities user, String rawRefresh) {
        var access = accessTokens.issue(user.userId(), user.companyId(), user.tokenVersion());
        return new SessionTokens(user.userId(), access.value(), access.lifetime(), rawRefresh, settings.refreshTokenTtl());
    }

    Instant now() {
        return Instant.now(clock);
    }
}
