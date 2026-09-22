package com.stockhub.shared.web;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Builds {@link ApiError} bodies with a message localized from the request's
 * {@code Accept-Language}, falling back to the exception's own message.
 */
@Component
public class ApiErrorFactory {

    private final MessageSource messages;
    private final Clock clock;

    public ApiErrorFactory(MessageSource messages, Clock clock) {
        this.messages = messages;
        this.clock = clock;
    }

    public ApiError create(HttpStatus status, String code, String fallbackMessage, Object[] args,
                           HttpServletRequest request, List<ApiError.FieldError> fieldErrors) {
        // The fallback is already formatted: passing it as MessageSource default would run MessageFormat on it again.
        String localized = messages.getMessage("error." + code, args, null, LocaleContextHolder.getLocale());
        String message = localized == null ? fallbackMessage : localized;
        return new ApiError(
                Instant.now(clock),
                status.value(),
                code,
                message,
                request.getRequestURI(),
                MDC.get(RequestIdFilter.MDC_KEY),
                fieldErrors);
    }

    public ApiError create(HttpStatus status, String code, HttpServletRequest request) {
        return create(status, code, status.getReasonPhrase(), null, request, List.of());
    }
}
