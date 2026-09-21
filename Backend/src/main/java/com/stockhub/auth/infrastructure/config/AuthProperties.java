package com.stockhub.auth.infrastructure.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param jwtSecret      Base64 HS512 key, at least 64 bytes once decoded
 * @param cookieSecure   Secure flag of the refresh cookie (localhost is a secure context for browsers)
 */
@ConfigurationProperties("stockhub.auth")
public record AuthProperties(
        String jwtSecret,
        String issuer,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        boolean cookieSecure,
        int maxFailedLogins,
        Duration loginLockDuration) {

    public AuthProperties {
        issuer = issuer == null ? "stockhub" : issuer;
        accessTokenTtl = accessTokenTtl == null ? Duration.ofMinutes(15) : accessTokenTtl;
        refreshTokenTtl = refreshTokenTtl == null ? Duration.ofDays(7) : refreshTokenTtl;
        maxFailedLogins = maxFailedLogins <= 0 ? 5 : maxFailedLogins;
        loginLockDuration = loginLockDuration == null ? Duration.ofMinutes(15) : loginLockDuration;
    }
}
