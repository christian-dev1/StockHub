package com.stockhub.shared.web;

import com.stockhub.shared.domain.exception.DomainException;
import com.stockhub.shared.domain.exception.ErrorKind;
import com.stockhub.shared.domain.exception.InvalidInputException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Translates every exception into a structured {@link ApiError}. Stack traces
 * and internal messages never reach the client; unexpected errors are logged
 * with the request id so they can be correlated.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final ApiErrorFactory errors;

    public GlobalExceptionHandler(ApiErrorFactory errors) {
        this.errors = errors;
    }

    @ExceptionHandler(DomainException.class)
    ResponseEntity<ApiError> handleDomain(DomainException ex, HttpServletRequest request) {
        HttpStatus status = statusOf(ex.kind());
        List<ApiError.FieldError> fields = ex instanceof InvalidInputException invalid
                ? List.of(new ApiError.FieldError(invalid.field(), ex.code(), ex.getMessage()))
                : List.of();
        return respond(errors.create(status, ex.code(), ex.getMessage(), ex.arguments().toArray(), request, fields));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiError.FieldError> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> new ApiError.FieldError(f.getField(), f.getCode(), f.getDefaultMessage()))
                .toList();
        return respond(errors.create(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Validation failed.", null, request, fields));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        List<ApiError.FieldError> fields = ex.getConstraintViolations().stream()
                .map(v -> new ApiError.FieldError(v.getPropertyPath().toString(),
                        v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName(), v.getMessage()))
                .toList();
        return respond(errors.create(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Validation failed.", null, request, fields));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiError> handleMalformed(Exception ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", request));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", request));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> handleMethod(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", request));
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ApiError> handleOptimisticLock(OptimisticLockingFailureException ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION", request));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return respond(errors.create(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", request));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> handleUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.CONTENT_TOO_LARGE, "PAYLOAD_TOO_LARGE", request));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.FORBIDDEN, "FORBIDDEN", request));
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return respond(errors.create(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", request));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return respond(errors.create(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", request));
    }

    /** Dispatches an exception to the matching handler (for advices that wrap failures). */
    public ResponseEntity<ApiError> handle(RuntimeException ex, HttpServletRequest request) {
        if (ex instanceof DomainException domain) {
            return handleDomain(domain, request);
        }
        if (ex instanceof OptimisticLockingFailureException lock) {
            return handleOptimisticLock(lock, request);
        }
        return handleUnexpected(ex, request);
    }

    private static ResponseEntity<ApiError> respond(ApiError body) {
        return ResponseEntity.status(body.status()).body(body);
    }

    static HttpStatus statusOf(ErrorKind kind) {
        return switch (kind) {
            case VALIDATION -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case BUSINESS_RULE -> HttpStatus.UNPROCESSABLE_CONTENT;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case TOO_MANY_REQUESTS -> HttpStatus.TOO_MANY_REQUESTS;
        };
    }
}
