package com.stockhub.company.domain.model;

import com.stockhub.company.domain.valueobject.CompanyContact;
import com.stockhub.company.domain.valueobject.CompanySettings;
import com.stockhub.company.domain.valueobject.Localization;
import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Objects;
import java.util.UUID;

/** A tenant of StockHub. */
public final class Company {

    private final UUID id;
    private String name;
    private String legalName;
    private CompanyContact contact;
    private Localization localization;
    private CompanyStatus status;
    private CompanySettings settings;
    private final long version;

    public Company(UUID id, String name, String legalName, CompanyContact contact, Localization localization,
                   CompanyStatus status, CompanySettings settings, long version) {
        this.id = Objects.requireNonNull(id);
        this.name = validName(name);
        this.legalName = validLegalName(legalName);
        this.contact = Objects.requireNonNull(contact);
        this.localization = Objects.requireNonNull(localization);
        this.status = Objects.requireNonNull(status);
        this.settings = Objects.requireNonNull(settings);
        this.version = version;
    }

    public static Company create(String name, String legalName, CompanyContact contact, Localization localization) {
        return new Company(Ids.newId(), name, legalName, contact, localization, CompanyStatus.ACTIVE,
                CompanySettings.DEFAULT, 0);
    }

    public void updateProfile(String newName, String newLegalName, CompanyContact newContact) {
        this.name = validName(newName);
        this.legalName = validLegalName(newLegalName);
        this.contact = Objects.requireNonNull(newContact);
    }

    public void configure(Localization newLocalization, CompanySettings newSettings) {
        this.localization = Objects.requireNonNull(newLocalization);
        this.settings = Objects.requireNonNull(newSettings);
    }

    public void disable() {
        status = CompanyStatus.DISABLED;
    }

    public void activate() {
        status = CompanyStatus.ACTIVE;
    }

    public boolean isActive() {
        return status == CompanyStatus.ACTIVE;
    }

    private static String validName(String value) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException("name", "COMPANY_NAME_REQUIRED", "Company name is required.");
        }
        String trimmed = value.strip();
        if (trimmed.length() > 150) {
            throw new InvalidInputException("name", "COMPANY_NAME_TOO_LONG", "Company name is too long.");
        }
        return trimmed;
    }

    private static String validLegalName(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.strip();
        if (trimmed.length() > 200) {
            throw new InvalidInputException("legalName", "FIELD_TOO_LONG", "Legal name is too long.");
        }
        return trimmed;
    }

    public UUID id() { return id; }
    public String name() { return name; }
    public String legalName() { return legalName; }
    public CompanyContact contact() { return contact; }
    public Localization localization() { return localization; }
    public CompanyStatus status() { return status; }
    public CompanySettings settings() { return settings; }
    public long version() { return version; }
}
