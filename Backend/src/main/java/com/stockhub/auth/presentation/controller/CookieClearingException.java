package com.stockhub.auth.presentation.controller;

import org.springframework.http.ResponseCookie;

/** Wraps a refresh failure so the error response also clears the stale cookie. */
class CookieClearingException extends RuntimeException {

    private final transient ResponseCookie clearCookie;

    CookieClearingException(RuntimeException cause, ResponseCookie clearCookie) {
        super(cause);
        this.clearCookie = clearCookie;
    }

    RuntimeException failure() {
        return (RuntimeException) getCause();
    }

    ResponseCookie clearCookie() {
        return clearCookie;
    }
}
