package com.stockhub.auth.presentation.response;

/** The refresh token is never in the body: it travels in an HttpOnly cookie. */
public record TokenResponse(String accessToken, String tokenType, long expiresIn, SessionResponse session) {
}
