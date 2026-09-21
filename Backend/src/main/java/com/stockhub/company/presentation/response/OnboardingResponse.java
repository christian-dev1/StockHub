package com.stockhub.company.presentation.response;

import com.stockhub.company.application.dto.OnboardingResult;
import java.util.UUID;

public record OnboardingResponse(CompanyResponse company, UUID primaryLocationId, UUID adminUserId) {

    public static OnboardingResponse from(OnboardingResult result) {
        return new OnboardingResponse(CompanyResponse.from(result.company()), result.primaryLocationId(),
                result.adminUserId());
    }
}
