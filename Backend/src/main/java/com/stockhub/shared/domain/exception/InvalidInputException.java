package com.stockhub.shared.domain.exception;

/** Business-level validation failure on a specific field (400). */
public class InvalidInputException extends DomainException {

    private final String field;

    public InvalidInputException(String field, String code, String message, Object... arguments) {
        super(ErrorKind.VALIDATION, code, message, arguments);
        this.field = field;
    }

    public String field() {
        return field;
    }
}
