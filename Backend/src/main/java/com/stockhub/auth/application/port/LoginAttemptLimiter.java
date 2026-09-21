package com.stockhub.auth.application.port;

public interface LoginAttemptLimiter {

    boolean isBlocked(String key);

    void recordFailure(String key);

    void reset(String key);
}
