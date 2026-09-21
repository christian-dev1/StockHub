package com.stockhub.auth.application.port;

public interface OpaqueTokenGenerator {

    /** A new high-entropy token, URL safe. */
    String generate();

    /** One-way hash used for storage and lookup. */
    String hash(String token);
}
