package com.stockhub.shared.infrastructure.persistence;

import java.util.Locale;

/** Builds case-insensitive LIKE patterns with escaped wildcards (escape character {@code \}). */
public final class LikePatterns {

    public static final char ESCAPE = '\\';

    private LikePatterns() {
    }

    public static String contains(String text) {
        return "%" + escape(text) + "%";
    }

    public static String startsWith(String text) {
        return escape(text) + "%";
    }

    private static String escape(String text) {
        return text.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
