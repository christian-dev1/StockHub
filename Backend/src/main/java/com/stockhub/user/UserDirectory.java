package com.stockhub.user;

import java.util.Optional;
import java.util.UUID;

/** Read side of users for authentication. */
public interface UserDirectory {

    /**
     * Verifies an email/password pair in constant time with respect to user existence.
     * Returns the user id when the credentials match an existing (possibly disabled) user.
     */
    Optional<UUID> verifyCredentials(String email, String rawPassword);

    Optional<UserAuthorities> loadAuthorities(UUID userId);

    void recordSuccessfulLogin(UUID userId);
}
