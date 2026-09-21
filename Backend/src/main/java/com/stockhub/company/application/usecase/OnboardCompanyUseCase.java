package com.stockhub.company.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.company.CompanyProvisioning;
import com.stockhub.company.application.command.CompanyProfileCommand;
import com.stockhub.company.application.command.OnboardCompanyCommand;
import com.stockhub.company.application.dto.CompanyView;
import com.stockhub.company.application.dto.OnboardingResult;
import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.repository.CompanyRepository;
import com.stockhub.company.domain.valueobject.CompanyContact;
import com.stockhub.company.domain.valueobject.Localization;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.UserProvisioning;
import com.stockhub.warehouse.LocationApi;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates a company with its primary location and first administrator in a
 * single transaction: either everything exists afterwards, or nothing does.
 */
@Service
public class OnboardCompanyUseCase implements CompanyProvisioning {

    private final CompanyRepository companies;
    private final CompanyLoader loader;
    private final LocationApi locations;
    private final UserProvisioning users;
    private final AuditRecorder audit;

    OnboardCompanyUseCase(CompanyRepository companies, CompanyLoader loader, LocationApi locations,
                          UserProvisioning users, AuditRecorder audit) {
        this.companies = companies;
        this.loader = loader;
        this.locations = locations;
        this.users = users;
        this.audit = audit;
    }

    @Transactional
    public OnboardingResult execute(OnboardCompanyCommand command) {
        return onboard(command, true);
    }

    @Override
    @Transactional
    public ProvisionedCompany provision(NewCompany company, NewAdmin admin) {
        var result = onboard(new OnboardCompanyCommand(
                new CompanyProfileCommand(company.name(), company.legalName(), company.email(), company.phone(),
                        company.addressLine(), company.city(), company.country()),
                company.currency(), company.timezone(), company.locale(),
                new OnboardCompanyCommand.AdminAccount(admin.email(), admin.firstName(), admin.lastName(), admin.password())),
                admin.temporaryPassword());
        return new ProvisionedCompany(result.company().id(), result.primaryLocationId(), result.adminUserId());
    }

    private OnboardingResult onboard(OnboardCompanyCommand command, boolean temporaryAdminPassword) {
        CompanyProfileCommand profile = command.profile();
        loader.requireUniqueName(profile.name(), null);
        Company company = Company.create(profile.name(), profile.legalName(), toContact(profile),
                new Localization(command.currency(), command.timezone(), command.locale()));
        companies.save(company);

        UUID primaryLocationId = locations.createPrimaryLocation(company.id(), company.name());
        var admin = command.admin();
        UUID adminId = users.provisionUser(company.id(), admin.email(), admin.firstName(), admin.lastName(),
                RoleCode.ADMIN, true, Set.of(), admin.temporaryPassword(), temporaryAdminPassword);

        CompanyView view = CompanyView.from(company);
        audit.record(AuditEntry.of("COMPANY_CREATED", "Company", company.id()).inCompany(company.id())
                .change(null, view.auditSnapshot())
                .withMetadata(Map.of("primaryLocationId", primaryLocationId, "adminUserId", adminId)));
        return new OnboardingResult(view, primaryLocationId, adminId);
    }

    static CompanyContact toContact(CompanyProfileCommand p) {
        return new CompanyContact(p.email(), p.phone(), p.addressLine(), p.city(), p.country());
    }
}
