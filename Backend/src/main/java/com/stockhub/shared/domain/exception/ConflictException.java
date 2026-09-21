package com.stockhub.shared.domain.exception;

public class ConflictException extends DomainException {

    public ConflictException(String code, String message, Object... arguments) {
        super(ErrorKind.CONFLICT, code, message, arguments);
    }
}
