package com.stockhub.shared.domain.exception;

public class UnauthorizedException extends DomainException {

    public UnauthorizedException(String code, String message, Object... arguments) {
        super(ErrorKind.UNAUTHORIZED, code, message, arguments);
    }
}
