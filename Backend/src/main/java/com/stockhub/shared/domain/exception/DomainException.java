package com.stockhub.shared.domain.exception;

import java.util.List;

/**
 * Base class of every expected business failure. The {@code code} is a stable,
 * machine readable identifier (e.g. {@code PRODUCT_SKU_ALREADY_EXISTS}) that the
 * API returns and that frontends translate.
 */
public class DomainException extends RuntimeException {

    private final String code;
    private final ErrorKind kind;
    private final transient List<Object> arguments;

    public DomainException(ErrorKind kind, String code, String message, Object... arguments) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.arguments = List.of(arguments);
    }

    public String code() {
        return code;
    }

    public ErrorKind kind() {
        return kind;
    }

    public List<Object> arguments() {
        return arguments;
    }
}
