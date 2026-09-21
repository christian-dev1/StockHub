package com.stockhub.company.presentation.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateCompanyRequest(@NotNull @Valid CompanyProfileRequest profile, @NotNull Long version) {
}
