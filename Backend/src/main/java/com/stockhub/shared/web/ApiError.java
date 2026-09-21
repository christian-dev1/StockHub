package com.stockhub.shared.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

@Schema(description = "Structured error returned by every failing endpoint")
public record ApiError(
        Instant timestamp,
        int status,
        @Schema(example = "PRODUCT_SKU_ALREADY_EXISTS") String code,
        String message,
        String path,
        String requestId,
        List<FieldError> fieldErrors) {

    public record FieldError(String field, String code, String message) {
    }
}
