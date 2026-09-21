package com.stockhub.shared.domain;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.UUID;

/**
 * Generates RFC 9562 UUID version 7 identifiers: time-ordered (index friendly)
 * yet not guessable, which matters for tenant isolation.
 */
public final class Ids {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static Clock clock = Clock.systemUTC();

    private Ids() {
    }

    public static UUID newId() {
        long millis = clock.millis();
        long randA = RANDOM.nextInt(1 << 12);
        long msb = (millis << 16) | (0x7L << 12) | randA;
        long lsb = (RANDOM.nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L;
        return new UUID(msb, lsb);
    }
}
