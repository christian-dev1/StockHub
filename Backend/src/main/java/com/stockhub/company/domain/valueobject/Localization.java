package com.stockhub.company.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Currency;
import java.util.Set;

/** Currency (ISO 4217), IANA time zone and UI locale of a company. */
public record Localization(String currency, String timezone, String locale) {

    public static final Set<String> SUPPORTED_LOCALES = Set.of("fr", "en");
    public static final Localization DEFAULT = new Localization("XAF", "Africa/Douala", "fr");

    public Localization {
        currency = validCurrency(currency);
        timezone = validZone(timezone);
        if (locale == null || !SUPPORTED_LOCALES.contains(locale)) {
            throw new InvalidInputException("locale", "COMPANY_LOCALE_UNSUPPORTED", "Unsupported locale.");
        }
    }

    private static String validCurrency(String code) {
        try {
            return Currency.getInstance(code == null ? "" : code.strip().toUpperCase()).getCurrencyCode();
        } catch (IllegalArgumentException e) {
            throw new InvalidInputException("currency", "COMPANY_CURRENCY_INVALID", "Currency must be an ISO 4217 code.");
        }
    }

    private static String validZone(String zone) {
        try {
            return ZoneId.of(zone == null ? "" : zone.strip()).getId();
        } catch (DateTimeException e) {
            throw new InvalidInputException("timezone", "COMPANY_TIMEZONE_INVALID", "Unknown time zone.");
        }
    }
}
