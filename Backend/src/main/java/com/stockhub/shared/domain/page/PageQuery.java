package com.stockhub.shared.domain.page;

/** Framework-free pagination request used by application queries. */
public record PageQuery(int page, int size, String sortField, boolean ascending) {

    public static final int MAX_SIZE = 100;

    public PageQuery {
        if (page < 0) {
            page = 0;
        }
        if (size < 1 || size > MAX_SIZE) {
            size = Math.clamp(size, 1, MAX_SIZE);
        }
    }

    public static PageQuery of(int page, int size) {
        return new PageQuery(page, size, null, true);
    }
}
