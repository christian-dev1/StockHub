package com.stockhub.shared.domain.exception;

public class ForbiddenException extends DomainException {

    public ForbiddenException(String code, String message, Object... arguments) {
        super(ErrorKind.FORBIDDEN, code, message, arguments);
    }
}
