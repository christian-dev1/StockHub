package com.stockhub.company.application.dto;

import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.model.CompanyStatus;
import java.util.Map;
import java.util.UUID;

public record CompanyView(
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
        boolean allowNegativeStock,
        int expiryWarningDays,
        int defaultLeadTimeDays,
        long version) {

    public static CompanyView from(Company c) {
        return new CompanyView(c.id(), c.name(), c.legalName(), c.contact().email(), c.contact().phone(),
                c.contact().addressLine(), c.contact().city(), c.contact().country(), c.localization().currency(),
                c.localization().timezone(), c.localization().locale(), c.status(), c.settings().allowNegativeStock(),
                c.settings().expiryWarningDays(), c.settings().defaultLeadTimeDays(), c.version());
    }

    public Map<String, Object> auditSnapshot() {
        var snapshot = new java.util.LinkedHashMap<String, Object>();
        snapshot.put("name", name);
        snapshot.put("legalName", legalName);
        snapshot.put("email", email);
        snapshot.put("phone", phone);
        snapshot.put("addressLine", addressLine);
        snapshot.put("city", city);
        snapshot.put("country", country);
        snapshot.put("currency", currency);
        snapshot.put("timezone", timezone);
        snapshot.put("locale", locale);
        snapshot.put("status", status);
        snapshot.put("allowNegativeStock", allowNegativeStock);
        snapshot.put("expiryWarningDays", expiryWarningDays);
        snapshot.put("defaultLeadTimeDays", defaultLeadTimeDays);
        return snapshot;
    }
}
