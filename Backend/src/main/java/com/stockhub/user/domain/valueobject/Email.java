package com.stockhub.user.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Locale;
import java.util.regex.Pattern;

/** Normalized (trimmed, lower-case) e-mail address used as login. */
public record Email(String value) {

    private static final Pattern FORMAT = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$");
    private static final int MAX_LENGTH = 254;

    public Email {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException("email", "USER_EMAIL_REQUIRED", "Email is required.");
        }
        value = value.strip().toLowerCase(Locale.ROOT);
        if (value.length() > MAX_LENGTH || !FORMAT.matcher(value).matches()) {
            throw new InvalidInputException("email", "USER_EMAIL_INVALID", "Email is invalid.");
        }
    }

    @Override
    public String toString() {
        return value;
    }
}
