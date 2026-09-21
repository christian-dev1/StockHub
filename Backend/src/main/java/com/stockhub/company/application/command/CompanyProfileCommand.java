package com.stockhub.company.application.command;

public record CompanyProfileCommand(
        String name,
        String legalName,
        String email,
        String phone,
        String addressLine,
        String city,
        String country) {
}
