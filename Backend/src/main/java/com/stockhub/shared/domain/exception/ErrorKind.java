package com.stockhub.shared.domain.exception;

/**
 * Category of a business failure. The presentation layer maps each kind to an
 * HTTP status so that the domain stays free of any web concern.
 */
public enum ErrorKind {
    VALIDATION,
    NOT_FOUND,
    CONFLICT,
    BUSINESS_RULE,
    FORBIDDEN,
    UNAUTHORIZED
}
