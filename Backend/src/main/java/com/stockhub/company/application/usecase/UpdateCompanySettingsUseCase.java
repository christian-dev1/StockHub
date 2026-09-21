package com.stockhub.company.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.company.application.command.CompanySettingsCommand;
import com.stockhub.company.application.dto.CompanyView;
import com.stockhub.company.application.port.CompanyStatusCache;
import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.repository.CompanyRepository;
import com.stockhub.company.domain.valueobject.CompanySettings;
import com.stockhub.company.domain.valueobject.Localization;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateCompanySettingsUseCase {

    private final CompanyRepository companies;
    private final CompanyLoader loader;
    private final CompanyStatusCache cache;
    private final AuditRecorder audit;

    UpdateCompanySettingsUseCase(CompanyRepository companies, CompanyLoader loader, CompanyStatusCache cache,
                                 AuditRecorder audit) {
        this.companies = companies;
        this.loader = loader;
        this.cache = cache;
        this.audit = audit;
    }

    @Transactional
    public CompanyView execute(UUID companyId, CompanySettingsCommand command) {
        Company company = loader.load(companyId, command.version());
        var before = CompanyView.from(company).auditSnapshot();
        company.configure(new Localization(command.currency(), command.timezone(), command.locale()),
                new CompanySettings(command.allowNegativeStock(), command.expiryWarningDays(),
                        command.defaultLeadTimeDays()));
        companies.save(company);
        cache.evict(companyId);
        CompanyView view = CompanyView.from(company);
        audit.record(AuditEntry.of("COMPANY_SETTINGS_UPDATED", "Company", companyId).inCompany(companyId)
                .change(before, view.auditSnapshot()));
        return view;
    }
}
