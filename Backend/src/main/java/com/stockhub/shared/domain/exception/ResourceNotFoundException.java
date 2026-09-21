package com.stockhub.shared.domain.exception;

/**
 * Raised when a resource does not exist <em>or belongs to another company</em>:
 * both cases are deliberately indistinguishable to avoid leaking data.
 */
public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String resource, Object id) {
        super(ErrorKind.NOT_FOUND, resource.toUpperCase() + "_NOT_FOUND", resource + " " + id + " was not found.");
    }
}
