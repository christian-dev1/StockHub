package com.stockhub.company.presentation.controller;

import com.stockhub.company.application.query.CompanySearchQuery;
import com.stockhub.company.application.usecase.AddCompanyAdminUseCase;
import com.stockhub.company.application.usecase.ChangeCompanyStatusUseCase;
import com.stockhub.company.application.usecase.CompanyQueries;
import com.stockhub.company.application.usecase.OnboardCompanyUseCase;
import com.stockhub.company.application.usecase.UpdateCompanyProfileUseCase;
import com.stockhub.company.domain.model.CompanyStatus;
import com.stockhub.company.presentation.request.AdminAccountRequest;
import com.stockhub.company.presentation.request.DisableCompanyRequest;
import com.stockhub.company.presentation.request.OnboardCompanyRequest;
import com.stockhub.company.presentation.request.UpdateCompanyRequest;
import com.stockhub.company.presentation.response.CompanyResponse;
import com.stockhub.company.presentation.response.OnboardingResponse;
import com.stockhub.shared.web.PageRequestParams;
import com.stockhub.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Platform administration of companies, reserved to the SUPER_ADMIN role.
 * Method-level {@code @PreAuthorize} replaces a class-level one, so every
 * method states the role explicitly (the URL rule in SecurityConfig adds a
 * second, independent barrier).
 */
@RestController
@RequestMapping("/api/v1/platform/companies")
@Tag(name = "Platform", description = "Company administration (super admin)")
class PlatformCompanyController {

    private final CompanyQueries queries;
    private final OnboardCompanyUseCase onboard;
    private final UpdateCompanyProfileUseCase updateProfile;
    private final ChangeCompanyStatusUseCase changeStatus;
    private final AddCompanyAdminUseCase addAdmin;

    PlatformCompanyController(CompanyQueries queries, OnboardCompanyUseCase onboard,
                              UpdateCompanyProfileUseCase updateProfile, ChangeCompanyStatusUseCase changeStatus,
                              AddCompanyAdminUseCase addAdmin) {
        this.queries = queries;
        this.onboard = onboard;
        this.updateProfile = updateProfile;
        this.changeStatus = changeStatus;
        this.addAdmin = addAdmin;
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('COMPANY_VIEW')")
    PageResponse<CompanyResponse> search(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) CompanyStatus status,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size,
                                         @RequestParam(required = false) String sort) {
        var pageQuery = PageRequestParams.toQuery(page, size, sort, Set.of("name", "status", "createdAt"), "name");
        return PageResponse.of(queries.search(new CompanySearchQuery(q, status, pageQuery)), CompanyResponse::from);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('COMPANY_VIEW')")
    CompanyResponse get(@PathVariable UUID id) {
        return CompanyResponse.from(queries.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('COMPANY_CREATE')")
    @Operation(summary = "Create a company with its primary location and first administrator (atomic)")
    ResponseEntity<OnboardingResponse> create(@Valid @RequestBody OnboardCompanyRequest request) {
        var result = onboard.execute(request.toCommand());
        return ResponseEntity.created(URI.create("/api/v1/platform/companies/" + result.company().id()))
                .body(OnboardingResponse.from(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('COMPANY_UPDATE')")
    CompanyResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCompanyRequest request) {
        return CompanyResponse.from(updateProfile.execute(id, request.profile().toCommand(), request.version()));
    }

    @PostMapping("/{id}/disable")
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('COMPANY_DISABLE')")
    @Operation(summary = "Disable a company: its users are signed out and can no longer sign in")
    CompanyResponse disable(@PathVariable UUID id, @Valid @RequestBody DisableCompanyRequest request) {
        return CompanyResponse.from(changeStatus.disable(id, request.reason()));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('COMPANY_DISABLE')")
    CompanyResponse activate(@PathVariable UUID id) {
        return CompanyResponse.from(changeStatus.activate(id));
    }

    @PostMapping("/{id}/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN') and hasAuthority('USER_CREATE')")
    ResponseEntity<Map<String, UUID>> addAdmin(@PathVariable UUID id, @Valid @RequestBody AdminAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("userId", addAdmin.execute(id, request.toAccount())));
    }
}
