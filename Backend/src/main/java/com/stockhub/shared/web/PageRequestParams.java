package com.stockhub.shared.web;

import com.stockhub.shared.domain.page.PageQuery;
import java.util.Set;

/**
 * Parses {@code page}, {@code size} and {@code sort=field,asc|desc} query
 * parameters, accepting only whitelisted sort fields.
 */
public final class PageRequestParams {

    private PageRequestParams() {
    }

    public static PageQuery toQuery(int page, int size, String sort, Set<String> allowedFields, String defaultField) {
        String field = defaultField;
        boolean ascending = true;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            if (allowedFields.contains(parts[0].trim())) {
                field = parts[0].trim();
            }
            ascending = parts.length < 2 || !"desc".equalsIgnoreCase(parts[1].trim());
        }
        return new PageQuery(page, size, field, ascending);
    }
}
