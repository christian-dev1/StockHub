package com.stockhub.company.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.company.application.command.CompanyProfileCommand;
import com.stockhub.company.application.dto.CompanyView;
import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.repository.CompanyRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Updates identity and contact details. The target company is resolved by the
 * caller (path id for the platform, token company for a company admin).
 */
@Service
public class UpdateCompanyProfileUseCase {

    private final CompanyRepository companies;
    private final CompanyLoader loader;
    private final AuditRecorder audit;

    UpdateCompanyProfileUseCase(CompanyRepository companies, CompanyLoader loader, AuditRecorder audit) {
        this.companies = companies;
        this.loader = loader;
        this.audit = audit;
    }

    @Transactional
    public CompanyView execute(UUID companyId, CompanyProfileCommand command, long version) {
        Company company = loader.load(companyId, version);
        loader.requireUniqueName(command.name(), companyId);
        var before = CompanyView.from(company).auditSnapshot();
        company.updateProfile(command.name(), command.legalName(), OnboardCompanyUseCase.toContact(command));
        companies.save(company);
        CompanyView view = CompanyView.from(company);
        audit.record(AuditEntry.of("COMPANY_UPDATED", "Company", companyId).inCompany(companyId)
                .change(before, view.auditSnapshot()));
        return view;
    }
}
