package com.stockhub.company.application.command;

public record OnboardCompanyCommand(
        CompanyProfileCommand profile,
        String currency,
        String timezone,
        String locale,
        AdminAccount admin) {

    public record AdminAccount(String email, String firstName, String lastName, String temporaryPassword) {
    }
}
