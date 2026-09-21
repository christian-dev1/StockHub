package com.stockhub.auth.presentation.controller;

import org.springframework.beans.factory.annotation.Value;
import java.time.Duration;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
class RefreshTokenCookie {

    static final String NAME = "stockhub_refresh";
    private static final String PATH = "/api/v1/auth";

    private final boolean secure;

    RefreshTokenCookie(@Value("${stockhub.auth.cookie-secure:true}") boolean secure) {
        this.secure = secure;
    }

    ResponseCookie create(String token, Duration maxAge) {
        return base(token).maxAge(maxAge).build();
    }

    ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(NAME, value).httpOnly(true).secure(secure).sameSite("Strict").path(PATH);
    }
}
