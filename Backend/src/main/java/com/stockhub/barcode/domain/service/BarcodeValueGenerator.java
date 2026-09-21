package com.stockhub.barcode.domain.service;

import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.InvalidInputException;

/**
 * Builds barcode values from a per-company counter.
 * <ul>
 *   <li>EAN-13: prefix {@code 20} (GS1 "restricted circulation", reserved for
 *       in-store numbering, never clashes with manufacturer GTINs) + 10-digit
 *       counter + check digit;</li>
 *   <li>CODE128: {@code SH} + 10-digit counter.</li>
 * </ul>
 */
public final class BarcodeValueGenerator {

    static final String EAN_PREFIX = "20";
    static final String CODE128_PREFIX = "SH";
    private static final long MAX_COUNTER = 9_999_999_999L;

    private BarcodeValueGenerator() {
    }

    public static String generate(Symbology symbology, long counter) {
        if (counter < 1 || counter > MAX_COUNTER) {
            throw new BusinessRuleViolationException("BARCODE_RANGE_EXHAUSTED", "No more barcode numbers are available.");
        }
        String number = "%010d".formatted(counter);
        return switch (symbology) {
            case EAN13 -> {
                String payload = EAN_PREFIX + number;
                yield payload + gs1CheckDigit(payload);
            }
            case CODE128 -> CODE128_PREFIX + number;
            default -> throw new InvalidInputException("format", "BARCODE_FORMAT_NOT_GENERATABLE",
                    "Only CODE128 and EAN-13 barcodes can be generated.");
        };
    }

    /** GS1 mod-10: weights 3 and 1 alternate from the rightmost payload digit. */
    public static int gs1CheckDigit(String payload) {
        int sum = 0;
        for (int i = 0; i < payload.length(); i++) {
            int digit = Character.digit(payload.charAt(payload.length() - 1 - i), 10);
            if (digit < 0) {
                throw new IllegalArgumentException("Digits only: " + payload);
            }
            sum += (i % 2 == 0 ? 3 : 1) * digit;
        }
        return (10 - sum % 10) % 10;
    }
}
