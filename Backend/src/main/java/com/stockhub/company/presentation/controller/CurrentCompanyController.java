package com.stockhub.company.presentation.controller;

import com.stockhub.company.application.usecase.CompanyQueries;
import com.stockhub.company.application.usecase.UpdateCompanyProfileUseCase;
import com.stockhub.company.application.usecase.UpdateCompanySettingsUseCase;
import com.stockhub.company.presentation.request.CompanySettingsRequest;
import com.stockhub.company.presentation.request.UpdateCompanyRequest;
import com.stockhub.company.presentation.response.CompanyResponse;
import com.stockhub.shared.security.CurrentUserProvider;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The caller's own company, resolved from the access token (never from the request). */
@RestController
@RequestMapping("/api/v1/company")
@Tag(name = "Company", description = "Current company profile and settings")
class CurrentCompanyController {

    private final CompanyQueries queries;
    private final UpdateCompanyProfileUseCase updateProfile;
    private final UpdateCompanySettingsUseCase updateSettings;
    private final CurrentUserProvider currentUser;

    CurrentCompanyController(CompanyQueries queries, UpdateCompanyProfileUseCase updateProfile,
                             UpdateCompanySettingsUseCase updateSettings, CurrentUserProvider currentUser) {
        this.queries = queries;
        this.updateProfile = updateProfile;
        this.updateSettings = updateSettings;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('COMPANY_VIEW')")
    CompanyResponse get() {
        return CompanyResponse.from(queries.get(currentUser.require().requireCompanyId()));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('COMPANY_UPDATE')")
    CompanyResponse update(@Valid @RequestBody UpdateCompanyRequest request) {
        return CompanyResponse.from(updateProfile.execute(currentUser.require().requireCompanyId(),
                request.profile().toCommand(), request.version()));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAuthority('COMPANY_UPDATE')")
    CompanyResponse updateSettings(@Valid @RequestBody CompanySettingsRequest request) {
        return CompanyResponse.from(updateSettings.execute(currentUser.require().requireCompanyId(), request.toCommand()));
    }
}
