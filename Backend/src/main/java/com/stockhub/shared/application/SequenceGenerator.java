package com.stockhub.shared.application;

import java.util.UUID;

/**
 * Per-company, gap-free counters used to build human readable references
 * (BE-2026-000001, PO-2026-000001, generated SKUs...). Must be called inside
 * the business transaction: the counter row stays locked until commit, which
 * serialises concurrent callers and guarantees uniqueness.
 */
public interface SequenceGenerator {

    /** Year-less counter, e.g. for generated product SKUs. */
    long next(UUID companyId, String sequence);

    /** Counter restarting every year, for document references. */
    long next(UUID companyId, String sequence, int year);

    /** Formats {@code PREFIX-YEAR-000042}. */
    static String documentNumber(String prefix, int year, long value) {
        return "%s-%d-%06d".formatted(prefix, year, value);
    }
}
