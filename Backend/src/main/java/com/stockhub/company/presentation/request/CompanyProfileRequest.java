package com.stockhub.company.presentation.request;

import com.stockhub.company.application.command.CompanyProfileCommand;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompanyProfileRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 200) String legalName,
        @Email @Size(max = 254) String email,
        @Size(max = 40) String phone,
        @Size(max = 255) String addressLine,
        @Size(max = 100) String city,
        @Pattern(regexp = "^[A-Za-z]{2}$") String country) {

    public CompanyProfileCommand toCommand() {
        return new CompanyProfileCommand(name, legalName, email, phone, addressLine, city, country);
    }
}
