package com.stockhub.supplier.domain.valueobject;

import com.stockhub.shared.domain.Texts;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Locale;

public record SupplierContact(String contactName, String email, String phone, String addressLine, String city,
                              String country) {

    public SupplierContact {
        contactName = Texts.optional(contactName, "contactName", 150);
        email = Texts.optionalEmail(email, "email");
        phone = Texts.optional(phone, "phone", 40);
        addressLine = Texts.optional(addressLine, "addressLine", 255);
        city = Texts.optional(city, "city", 100);
        country = Texts.optional(country, "country", 2);
        if (country != null) {
            if (!country.matches("[A-Za-z]{2}")) {
                throw new InvalidInputException("country", "COUNTRY_INVALID", "Country must be an ISO 3166-1 alpha-2 code.");
            }
            country = country.toUpperCase(Locale.ROOT);
        }
    }
}
