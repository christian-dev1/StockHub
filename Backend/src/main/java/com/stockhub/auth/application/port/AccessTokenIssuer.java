package com.stockhub.auth.application.port;

import java.time.Duration;
import java.util.UUID;

public interface AccessTokenIssuer {

    IssuedAccessToken issue(UUID userId, UUID companyId, int tokenVersion);

    record IssuedAccessToken(String value, Duration lifetime) {
    }
}
