package com.stockhub.company.presentation.request;

import com.stockhub.company.application.command.CompanySettingsCommand;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CompanySettingsRequest(
        @NotBlank @Size(min = 3, max = 3) String currency,
        @NotBlank @Size(max = 64) String timezone,
        @NotBlank String locale,
        @NotNull Boolean allowNegativeStock,
        @NotNull @Min(1) @Max(365) Integer expiryWarningDays,
        @NotNull @Min(0) @Max(365) Integer defaultLeadTimeDays,
        @NotNull Long version) {

    public CompanySettingsCommand toCommand() {
        return new CompanySettingsCommand(currency, timezone, locale, allowNegativeStock, expiryWarningDays,
                defaultLeadTimeDays, version);
    }
}
