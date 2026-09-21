package com.stockhub.company.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Locale;
import java.util.regex.Pattern;

/** Optional contact details; blank values are normalized to null. */
public record CompanyContact(String email, String phone, String addressLine, String city, String country) {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$");
    private static final Pattern COUNTRY = Pattern.compile("^[A-Z]{2}$");

    public CompanyContact {
        email = blankToNull(email);
        phone = limit(blankToNull(phone), "phone", 40);
        addressLine = limit(blankToNull(addressLine), "addressLine", 255);
        city = limit(blankToNull(city), "city", 100);
        country = blankToNull(country);
        if (email != null) {
            email = email.toLowerCase(Locale.ROOT);
            if (email.length() > 254 || !EMAIL.matcher(email).matches()) {
                throw new InvalidInputException("email", "COMPANY_EMAIL_INVALID", "Email is invalid.");
            }
        }
        if (country != null) {
            country = country.toUpperCase(Locale.ROOT);
            if (!COUNTRY.matcher(country).matches()) {
                throw new InvalidInputException("country", "COMPANY_COUNTRY_INVALID", "Country must be an ISO 3166-1 alpha-2 code.");
            }
        }
    }

    public static CompanyContact empty() {
        return new CompanyContact(null, null, null, null, null);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static String limit(String value, String field, int max) {
        if (value != null && value.length() > max) {
            throw new InvalidInputException(field, "FIELD_TOO_LONG", field + " is too long.");
        }
        return value;
    }
}
