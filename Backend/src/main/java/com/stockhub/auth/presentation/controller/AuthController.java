package com.stockhub.auth.presentation.controller;

import com.stockhub.auth.application.dto.SessionTokens;
import com.stockhub.auth.application.usecase.GetSessionQuery;
import com.stockhub.auth.application.usecase.LoginUseCase;
import com.stockhub.auth.application.usecase.LogoutUseCase;
import com.stockhub.auth.application.usecase.RefreshSessionUseCase;
import com.stockhub.auth.presentation.request.LoginRequest;
import com.stockhub.auth.presentation.response.SessionResponse;
import com.stockhub.auth.presentation.response.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication")
class AuthController {

    private final LoginUseCase login;
    private final RefreshSessionUseCase refresh;
    private final LogoutUseCase logout;
    private final GetSessionQuery session;
    private final RefreshTokenCookie cookie;

    AuthController(LoginUseCase login, RefreshSessionUseCase refresh, LogoutUseCase logout, GetSessionQuery session,
                   RefreshTokenCookie cookie) {
        this.login = login;
        this.refresh = refresh;
        this.logout = logout;
        this.session = session;
        this.cookie = cookie;
    }

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(summary = "Sign in: returns an access token and sets the HttpOnly refresh cookie")
    ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return respond(login.execute(request.email(), request.password()));
    }

    @PostMapping("/refresh")
    @SecurityRequirements
    @Operation(summary = "Rotate the refresh cookie and obtain a new access token")
    ResponseEntity<TokenResponse> refresh(@CookieValue(name = RefreshTokenCookie.NAME, required = false) String token) {
        try {
            return respond(refresh.execute(token));
        } catch (RuntimeException failure) {
            throw new CookieClearingException(failure, cookie.clear());
        }
    }

    @PostMapping("/logout")
    @SecurityRequirements
    @Operation(summary = "Revoke the current refresh token family and clear the cookie")
    ResponseEntity<Void> logout(@CookieValue(name = RefreshTokenCookie.NAME, required = false) String token) {
        logout.execute(token);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie.clear().toString()).build();
    }

    @GetMapping("/me")
    @Operation(summary = "Current user, permissions, accessible locations and company")
    SessionResponse me() {
        return SessionResponse.from(session.execute());
    }

    private ResponseEntity<TokenResponse> respond(SessionTokens tokens) {
        var body = new TokenResponse(tokens.accessToken(), "Bearer", tokens.accessTokenLifetime().toSeconds(),
                SessionResponse.from(session.describe(tokens.userId())));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, cookie.create(tokens.refreshToken(), tokens.refreshTokenLifetime()).toString())
                .body(body);
    }
}
