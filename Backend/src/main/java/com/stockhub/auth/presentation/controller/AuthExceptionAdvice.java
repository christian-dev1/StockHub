package com.stockhub.auth.presentation.controller;

import com.stockhub.shared.web.ApiError;
import com.stockhub.shared.web.GlobalExceptionHandler;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = AuthController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
class AuthExceptionAdvice {

    private final GlobalExceptionHandler globalHandler;

    AuthExceptionAdvice(GlobalExceptionHandler globalHandler) {
        this.globalHandler = globalHandler;
    }

    @ExceptionHandler(CookieClearingException.class)
    ResponseEntity<ApiError> handle(CookieClearingException ex, HttpServletRequest request) {
        ResponseEntity<ApiError> response = globalHandler.handle(ex.failure(), request);
        return ResponseEntity.status(response.getStatusCode())
                .header(HttpHeaders.SET_COOKIE, ex.clearCookie().toString())
                .body(response.getBody());
    }
}
