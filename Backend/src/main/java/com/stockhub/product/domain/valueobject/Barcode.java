package com.stockhub.product.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Objects;

/**
 * A product barcode and its symbology. GTIN formats (EAN-13, EAN-8, UPC-A)
 * must carry a valid GS1 check digit; CODE128 accepts printable ASCII.
 */
public record Barcode(String value, BarcodeFormat format) {

    public static final int MAX_LENGTH = 64;

    public Barcode {
        Objects.requireNonNull(format, "format");
        if (value == null || value.isBlank()) {
            throw invalid("PRODUCT_BARCODE_REQUIRED", "Barcode is required.");
        }
        value = value.strip();
        switch (format) {
            case EAN13 -> requireGtin(value, 13);
            case EAN8 -> requireGtin(value, 8);
            case UPC_A -> requireGtin(value, 12);
            case CODE128 -> requireCode128(value);
        }
    }

    /**
     * Guesses the symbology of a scanned or typed value. An all-digit value of
     * GTIN length (8, 12 or 13) is treated as a GTIN, so a wrong check digit is
     * reported as the probable typo it is; anything else is CODE128.
     */
    public static Barcode detect(String value) {
        String trimmed = value == null ? "" : value.strip();
        if (trimmed.matches("\\d+")) {
            BarcodeFormat gtin = switch (trimmed.length()) {
                case 13 -> BarcodeFormat.EAN13;
                case 12 -> BarcodeFormat.UPC_A;
                case 8 -> BarcodeFormat.EAN8;
                default -> null;
            };
            if (gtin != null) {
                return new Barcode(trimmed, gtin);
            }
        }
        return new Barcode(trimmed, BarcodeFormat.CODE128);
    }

    /** GS1 mod-10 check digit of the payload (all digits but the last). */
    public static int checkDigit(String payload) {
        int sum = 0;
        for (int i = 0; i < payload.length(); i++) {
            int digit = payload.charAt(payload.length() - 1 - i) - '0';
            sum += (i % 2 == 0) ? digit * 3 : digit;
        }
        return (10 - sum % 10) % 10;
    }

    private static boolean hasValidCheckDigit(String digits) {
        int expected = checkDigit(digits.substring(0, digits.length() - 1));
        return digits.charAt(digits.length() - 1) - '0' == expected;
    }

    private static void requireGtin(String value, int length) {
        if (value.length() != length || !value.matches("\\d+")) {
            throw invalid("PRODUCT_BARCODE_INVALID_LENGTH", "This barcode format requires exactly %d digits.", length);
        }
        if (!hasValidCheckDigit(value)) {
            throw invalid("PRODUCT_BARCODE_INVALID_CHECK_DIGIT", "The barcode check digit is invalid.");
        }
    }

    private static void requireCode128(String value) {
        if (value.length() > MAX_LENGTH) {
            throw invalid("PRODUCT_BARCODE_TOO_LONG", "Barcode is too long.");
        }
        if (!value.chars().allMatch(c -> c >= 32 && c <= 126)) {
            throw invalid("PRODUCT_BARCODE_INVALID_CHARACTERS", "CODE128 barcodes only accept printable ASCII characters.");
        }
    }

    private static InvalidInputException invalid(String code, String message, Object... args) {
        return new InvalidInputException("barcode", code, message, args);
    }
}
