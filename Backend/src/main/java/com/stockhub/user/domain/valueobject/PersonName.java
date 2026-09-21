package com.stockhub.user.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;

public record PersonName(String firstName, String lastName) {

    private static final int MAX_LENGTH = 80;

    public PersonName {
        firstName = require(firstName, "firstName");
        lastName = require(lastName, "lastName");
    }

    private static String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(field, "USER_NAME_REQUIRED", field + " is required.");
        }
        String trimmed = value.strip();
        if (trimmed.length() > MAX_LENGTH) {
            throw new InvalidInputException(field, "USER_NAME_TOO_LONG", field + " is too long.");
        }
        return trimmed;
    }
}
