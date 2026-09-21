package com.stockhub.shared.domain.exception;

public class BusinessRuleViolationException extends DomainException {

    public BusinessRuleViolationException(String code, String message, Object... arguments) {
        super(ErrorKind.BUSINESS_RULE, code, message, arguments);
    }
}
