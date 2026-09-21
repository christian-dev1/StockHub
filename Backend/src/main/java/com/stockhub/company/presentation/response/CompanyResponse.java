package com.stockhub.company.presentation.response;

import com.stockhub.company.application.dto.CompanyView;
import com.stockhub.company.domain.model.CompanyStatus;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String legalName,
        String email,
        String phone,
        String addressLine,
        String city,
        String country,
        String currency,
        String timezone,
        String locale,
        CompanyStatus status,
        Settings settings,
        long version) {

    public record Settings(boolean allowNegativeStock, int expiryWarningDays, int defaultLeadTimeDays) {
    }

    public static CompanyResponse from(CompanyView v) {
        return new CompanyResponse(v.id(), v.name(), v.legalName(), v.email(), v.phone(), v.addressLine(), v.city(),
                v.country(), v.currency(), v.timezone(), v.locale(), v.status(),
                new Settings(v.allowNegativeStock(), v.expiryWarningDays(), v.defaultLeadTimeDays()), v.version());
    }
}
