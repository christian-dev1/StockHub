package com.stockhub.company.presentation.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisableCompanyRequest(@NotBlank @Size(max = 500) String reason) {
}
