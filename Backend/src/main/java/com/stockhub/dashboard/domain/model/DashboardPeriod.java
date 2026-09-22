package com.stockhub.dashboard.domain.model;

import com.stockhub.shared.domain.exception.InvalidInputException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/**
 * Calendar days covered by a dashboard, both included, in the company time zone, and the size of
 * the chart buckets. Presets end today: 7D is today and the 6 previous days, 3M starts on the same
 * day three months ago plus one, and so on.
 *
 * <p>Buckets: hours for a single day, days up to 31 days, ISO weeks (Monday) up to 183 days, months
 * beyond.
 */
public record DashboardPeriod(String code, LocalDate from, LocalDate to, Granularity granularity) {

    public enum Granularity {
        HOUR,
        DAY,
        WEEK,
        MONTH
    }

    /** Longest custom period accepted, to keep the chart and the queries bounded. */
    public static final int MAX_DAYS = 3 * 366;

    public DashboardPeriod {
        if (from.isAfter(to)) {
            throw new InvalidInputException(
                    "from", "INVALID_PERIOD", "The start of the period is after its end.");
        }
        if (ChronoUnit.DAYS.between(from, to) >= MAX_DAYS) {
            throw new InvalidInputException(
                    "to", "INVALID_PERIOD", "The period cannot exceed three years.");
        }
    }

    public static DashboardPeriod of(
            String code, LocalDate customFrom, LocalDate customTo, LocalDate today) {
        String normalized = code == null ? "30D" : code.strip().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "TODAY" -> preset(normalized, today, today);
            case "7D" -> preset(normalized, today.minusDays(6), today);
            case "30D" -> preset(normalized, today.minusDays(29), today);
            case "3M" -> preset(normalized, today.minusMonths(3).plusDays(1), today);
            case "1Y" -> preset(normalized, today.minusYears(1).plusDays(1), today);
            case "CUSTOM" -> custom(customFrom, customTo, today);
            default ->
                    throw new InvalidInputException(
                            "period",
                            "INVALID_PERIOD",
                            "Unknown period %s: use TODAY, 7D, 30D, 3M, 1Y or CUSTOM.",
                            code);
        };
    }

    private static DashboardPeriod custom(LocalDate from, LocalDate to, LocalDate today) {
        if (from == null || to == null) {
            throw new InvalidInputException(
                    from == null ? "from" : "to",
                    "INVALID_PERIOD",
                    "A custom period needs a start and an end date.");
        }
        if (to.isAfter(today)) {
            throw new InvalidInputException(
                    "to", "INVALID_PERIOD", "The end of the period cannot be in the future.");
        }
        return preset("CUSTOM", from, to);
    }

    private static DashboardPeriod preset(String code, LocalDate from, LocalDate to) {
        return new DashboardPeriod(code, from, to, granularityFor(from, to));
    }

    static Granularity granularityFor(LocalDate from, LocalDate to) {
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days == 1) return Granularity.HOUR;
        if (days <= 31) return Granularity.DAY;
        if (days <= 183) return Granularity.WEEK;
        return Granularity.MONTH;
    }

    public long days() {
        return ChronoUnit.DAYS.between(from, to) + 1;
    }
}
