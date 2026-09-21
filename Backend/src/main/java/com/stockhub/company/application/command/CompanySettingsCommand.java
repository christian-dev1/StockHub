package com.stockhub.company.application.command;

public record CompanySettingsCommand(
        String currency,
        String timezone,
        String locale,
        boolean allowNegativeStock,
        int expiryWarningDays,
        int defaultLeadTimeDays,
        long version) {
}
