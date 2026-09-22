package com.stockhub.stock.presentation.controller;

import com.stockhub.shared.web.ApiError;
import com.stockhub.shared.web.ApiErrorFactory;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.core.annotation.Order;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice(assignableTypes = StockController.class)
@Order(-1)
class StockExceptionHandler {
    private final ApiErrorFactory errors;

    StockExceptionHandler(ApiErrorFactory errors) {
        this.errors = errors;
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    ResponseEntity<ApiError> conflict(
            PessimisticLockingFailureException error, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(errors.create(HttpStatus.CONFLICT, "STOCK_CONFLICT", request));
    }
}
