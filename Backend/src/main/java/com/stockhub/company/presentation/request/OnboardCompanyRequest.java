package com.stockhub.company.presentation.request;

import com.stockhub.company.application.command.OnboardCompanyCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OnboardCompanyRequest(
        @NotNull @Valid CompanyProfileRequest profile,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @NotBlank @Size(max = 64) String timezone,
        @NotBlank String locale,
        @NotNull @Valid AdminAccountRequest admin) {

    public OnboardCompanyCommand toCommand() {
        return new OnboardCompanyCommand(profile.toCommand(), currency, timezone, locale, admin.toAccount());
    }
}
