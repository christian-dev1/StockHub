package com.stockhub.shared.domain;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Locale;
import java.util.regex.Pattern;

/** Normalisation and validation of free-text fields in domain models. */
public final class Texts {

    private static final Pattern CODE = Pattern.compile("[A-Z0-9][A-Z0-9_-]*");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private Texts() {
    }

    /** Trimmed mandatory text; errors are reported as {@code <PREFIX>_<FIELD>_REQUIRED|_TOO_LONG}. */
    public static String required(String value, String field, int max, String errorPrefix) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(field, errorPrefix + "_" + upperSnake(field) + "_REQUIRED", field + " is required.");
        }
        String trimmed = value.strip();
        if (trimmed.length() > max) {
            throw new InvalidInputException(field, errorPrefix + "_" + upperSnake(field) + "_TOO_LONG", field + " is too long.");
        }
        return trimmed;
    }

    /** Trimmed optional text; blank becomes {@code null}. */
    public static String optional(String value, String field, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.strip();
        if (trimmed.length() > max) {
            throw new InvalidInputException(field, "FIELD_TOO_LONG", field + " is too long.");
        }
        return trimmed;
    }

    /** Upper-case business code made of letters, digits, '-' and '_'. */
    public static String code(String value, String field, int max, String errorPrefix) {
        String code = required(value, field, max, errorPrefix).toUpperCase(Locale.ROOT);
        if (!CODE.matcher(code).matches()) {
            throw new InvalidInputException(field, errorPrefix + "_" + upperSnake(field) + "_INVALID",
                    "Only letters, digits, '-' and '_' are allowed.");
        }
        return code;
    }

    public static String optionalEmail(String value, String field) {
        String email = optional(value, field, 254);
        if (email != null && !EMAIL.matcher(email).matches()) {
            throw new InvalidInputException(field, "EMAIL_INVALID", "Email address is invalid.");
        }
        return email == null ? null : email.toLowerCase(Locale.ROOT);
    }

    private static String upperSnake(String field) {
        return field.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase(Locale.ROOT);
    }
}
