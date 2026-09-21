package com.stockhub.shared.security;

import java.util.Optional;

public interface CurrentUserProvider {

    Optional<CurrentUser> current();

    /** @throws com.stockhub.shared.domain.exception.UnauthorizedException when no user is authenticated */
    CurrentUser require();
}
