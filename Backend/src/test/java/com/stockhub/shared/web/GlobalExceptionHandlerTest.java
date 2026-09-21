package com.stockhub.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.stockhub.shared.domain.exception.ErrorKind;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;

class GlobalExceptionHandlerTest {

    @ParameterizedTest
    @CsvSource({
            "VALIDATION, BAD_REQUEST",
            "NOT_FOUND, NOT_FOUND",
            "CONFLICT, CONFLICT",
            "BUSINESS_RULE, UNPROCESSABLE_CONTENT",
            "FORBIDDEN, FORBIDDEN",
            "UNAUTHORIZED, UNAUTHORIZED",
            "TOO_MANY_REQUESTS, TOO_MANY_REQUESTS"
    })
    void mapsEveryErrorKindToAnHttpStatus(ErrorKind kind, HttpStatus expected) {
        assertThat(GlobalExceptionHandler.statusOf(kind)).isEqualTo(expected);
    }
}
