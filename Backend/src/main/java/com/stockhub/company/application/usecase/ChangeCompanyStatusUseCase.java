package com.stockhub.company.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.company.application.dto.CompanyView;
import com.stockhub.company.application.port.CompanyStatusCache;
import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.repository.CompanyRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Disabling a company immediately blocks sign-in, token refresh and every
 * request of its users (status is checked on each authenticated request).
 */
@Service
public class ChangeCompanyStatusUseCase {

    private final CompanyRepository companies;
    private final CompanyLoader loader;
    private final CompanyStatusCache cache;
    private final AuditRecorder audit;

    ChangeCompanyStatusUseCase(CompanyRepository companies, CompanyLoader loader, CompanyStatusCache cache,
                               AuditRecorder audit) {
        this.companies = companies;
        this.loader = loader;
        this.cache = cache;
        this.audit = audit;
    }

    @Transactional
    public CompanyView disable(UUID companyId, String reason) {
        Company company = loader.load(companyId);
        company.disable();
        return persist(company, "COMPANY_DISABLED", reason);
    }

    @Transactional
    public CompanyView activate(UUID companyId) {
        Company company = loader.load(companyId);
        company.activate();
        return persist(company, "COMPANY_ENABLED", null);
    }

    private CompanyView persist(Company company, String action, String reason) {
        companies.save(company);
        cache.evict(company.id());
        audit.record(AuditEntry.of(action, "Company", company.id()).inCompany(company.id())
                .withMetadata(reason == null || reason.isBlank() ? Map.of() : Map.of("reason", reason.strip())));
        return CompanyView.from(company);
    }
}
