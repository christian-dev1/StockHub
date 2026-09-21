package com.stockhub.auth.infrastructure.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.stockhub.auth.application.port.LoginAttemptLimiter;
import com.stockhub.auth.infrastructure.config.AuthProperties;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * Brute-force protection per (e-mail, IP): after N failures the pair is locked
 * for the configured duration. In-memory by design for a single-node MVP.
 */
@Component
class CaffeineLoginAttemptLimiter implements LoginAttemptLimiter {

    private final Cache<String, AtomicInteger> failures;
    private final int maxFailures;

    CaffeineLoginAttemptLimiter(AuthProperties properties) {
        this.maxFailures = properties.maxFailedLogins();
        this.failures = Caffeine.newBuilder()
                .expireAfterWrite(properties.loginLockDuration())
                .maximumSize(100_000)
                .build();
    }

    @Override
    public boolean isBlocked(String key) {
        AtomicInteger count = failures.getIfPresent(key);
        return count != null && count.get() >= maxFailures;
    }

    @Override
    public void recordFailure(String key) {
        failures.asMap().computeIfAbsent(key, k -> new AtomicInteger()).incrementAndGet();
    }

    @Override
    public void reset(String key) {
        failures.invalidate(key);
    }
}
