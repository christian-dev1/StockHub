package com.stockhub.company;

import java.util.UUID;

/** Read-only view of a company exposed to other modules. */
public record CompanySnapshot(
        UUID id,
        String name,
        String currency,
        String timezone,
        String locale,
        boolean active,
        boolean allowNegativeStock,
        int expiryWarningDays,
        int defaultLeadTimeDays) {
}
