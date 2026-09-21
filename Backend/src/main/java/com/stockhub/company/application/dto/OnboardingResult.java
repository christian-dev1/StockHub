package com.stockhub.company.application.dto;

import java.util.UUID;

public record OnboardingResult(CompanyView company, UUID primaryLocationId, UUID adminUserId) {
}
