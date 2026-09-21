package com.stockhub.auth.application.usecase;

import java.time.Duration;

/** Token lifetimes, provided by configuration. */
public record AuthSettings(Duration accessTokenTtl, Duration refreshTokenTtl) {
}
