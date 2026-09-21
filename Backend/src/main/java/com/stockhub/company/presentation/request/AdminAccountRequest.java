package com.stockhub.company.presentation.request;

import com.stockhub.company.application.command.OnboardCompanyCommand.AdminAccount;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminAccountRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotBlank @Size(min = 10, max = 128) String temporaryPassword) {

    public AdminAccount toAccount() {
        return new AdminAccount(email, firstName, lastName, temporaryPassword);
    }
}
