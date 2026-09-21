package com.stockhub.warehouse.domain.model;

import com.stockhub.shared.domain.exception.InvalidInputException;

public record LocationAddress(String addressLine, String city, String phone) {

    public static final LocationAddress EMPTY = new LocationAddress(null, null, null);

    public LocationAddress {
        addressLine = optional(addressLine, "addressLine", 255);
        city = optional(city, "city", 100);
        phone = optional(phone, "phone", 40);
    }

    private static String optional(String value, String field, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.strip();
        if (trimmed.length() > max) {
            throw new InvalidInputException(field, "FIELD_TOO_LONG", field + " is too long.");
        }
        return trimmed;
    }
}
