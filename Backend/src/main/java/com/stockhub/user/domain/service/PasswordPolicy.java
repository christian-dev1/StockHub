package com.stockhub.user.domain.service;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Locale;

/**
 * Password rules: 10 to 128 characters, at least one letter and one digit,
 * and not containing the user's e-mail local part.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 10;
    public static final int MAX_LENGTH = 128;

    private PasswordPolicy() {
    }

    public static void validate(String password, String email) {
        if (password == null || password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw weak("PASSWORD_LENGTH_INVALID", "Password must contain between 10 and 128 characters.");
        }
        if (password.chars().noneMatch(Character::isLetter) || password.chars().noneMatch(Character::isDigit)) {
            throw weak("PASSWORD_TOO_WEAK", "Password must contain letters and digits.");
        }
        String localPart = email == null ? "" : email.split("@")[0].toLowerCase(Locale.ROOT);
        if (localPart.length() >= 3 && password.toLowerCase(Locale.ROOT).contains(localPart)) {
            throw weak("PASSWORD_CONTAINS_EMAIL", "Password must not contain your e-mail address.");
        }
    }

    private static InvalidInputException weak(String code, String message) {
        return new InvalidInputException("password", code, message);
    }
}
