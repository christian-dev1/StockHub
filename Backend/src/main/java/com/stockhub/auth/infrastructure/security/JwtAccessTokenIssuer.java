package com.stockhub.auth.infrastructure.security;

import com.stockhub.auth.application.port.AccessTokenIssuer;
import com.stockhub.auth.infrastructure.config.AuthProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

/**
 * Access tokens carry identity only (user, company, token version). Roles and
 * permissions are resolved server side on every request.
 */
@Component
class JwtAccessTokenIssuer implements AccessTokenIssuer {

    static final String COMPANY_CLAIM = "cid";
    static final String TOKEN_VERSION_CLAIM = "tv";

    private final JwtEncoder encoder;
    private final AuthProperties properties;
    private final Clock clock;

    JwtAccessTokenIssuer(JwtEncoder encoder, AuthProperties properties, Clock clock) {
        this.encoder = encoder;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public IssuedAccessToken issue(UUID userId, UUID companyId, int tokenVersion) {
        Instant now = Instant.now(clock);
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .subject(userId.toString())
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiresAt(now.plus(properties.accessTokenTtl()))
                .claim(TOKEN_VERSION_CLAIM, tokenVersion);
        if (companyId != null) {
            claims.claim(COMPANY_CLAIM, companyId.toString());
        }
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS512).build(), claims.build()))
                .getTokenValue();
        return new IssuedAccessToken(token, properties.accessTokenTtl());
    }
}
