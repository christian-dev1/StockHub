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

    /**
     * @param message   English fallback with {@code String.format} placeholders, filled from the arguments
     * @param arguments values shown in the message (also passed to localized bundles)
     */
    public DomainException(ErrorKind kind, String code, String message, Object... arguments) {
        super(arguments.length == 0 || message == null ? message : message.formatted(arguments));
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
