package com.stockhub.auth.domain.exception;

import com.stockhub.shared.domain.exception.DomainException;
import com.stockhub.shared.domain.exception.ErrorKind;
import com.stockhub.shared.domain.exception.UnauthorizedException;

public final class AuthErrors {

    private AuthErrors() {
    }

    /** Deliberately identical for unknown e-mail and wrong password. */
    public static UnauthorizedException invalidCredentials() {
        return new UnauthorizedException("AUTH_INVALID_CREDENTIALS", "Invalid email or password.");
    }

    public static UnauthorizedException accountDisabled() {
        return new UnauthorizedException("AUTH_ACCOUNT_DISABLED", "This account is disabled.");
    }

    public static UnauthorizedException companyDisabled() {
        return new UnauthorizedException("AUTH_COMPANY_DISABLED", "Your company account is disabled.");
    }

    public static UnauthorizedException invalidRefreshToken() {
        return new UnauthorizedException("AUTH_REFRESH_TOKEN_INVALID", "Your session has expired. Please sign in again.");
    }

    public static DomainException tooManyAttempts() {
        return new DomainException(ErrorKind.TOO_MANY_REQUESTS, "AUTH_TOO_MANY_ATTEMPTS",
                "Too many failed attempts. Please try again later.");
    }
}
