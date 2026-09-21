package com.stockhub.company.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;

/**
 * Operational rules of a company.
 *
 * @param allowNegativeStock  negative stock is refused unless explicitly allowed (default false)
 * @param expiryWarningDays   how many days before expiry a batch raises an alert
 * @param defaultLeadTimeDays supplier lead time used when a supplier defines none
 */
public record CompanySettings(boolean allowNegativeStock, int expiryWarningDays, int defaultLeadTimeDays) {

    public static final CompanySettings DEFAULT = new CompanySettings(false, 30, 7);

    public CompanySettings {
        if (expiryWarningDays < 1 || expiryWarningDays > 365) {
            throw new InvalidInputException("expiryWarningDays", "COMPANY_SETTING_OUT_OF_RANGE", "Must be between 1 and 365.");
        }
        if (defaultLeadTimeDays < 0 || defaultLeadTimeDays > 365) {
            throw new InvalidInputException("defaultLeadTimeDays", "COMPANY_SETTING_OUT_OF_RANGE", "Must be between 0 and 365.");
        }
    }
}
