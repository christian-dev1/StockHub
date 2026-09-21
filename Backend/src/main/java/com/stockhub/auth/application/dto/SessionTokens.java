package com.stockhub.auth.application.dto;

import java.time.Duration;
import java.util.UUID;

/** Result of a login or refresh: a new access token and the rotated refresh token. */
public record SessionTokens(UUID userId, String accessToken, Duration accessTokenLifetime, String refreshToken,
                            Duration refreshTokenLifetime) {
}
