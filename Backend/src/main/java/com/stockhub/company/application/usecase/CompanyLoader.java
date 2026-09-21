package com.stockhub.company.application.usecase;

import com.stockhub.company.domain.exception.CompanyErrors;
import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.repository.CompanyRepository;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

@Component
class CompanyLoader {

    private final CompanyRepository companies;

    CompanyLoader(CompanyRepository companies) {
        this.companies = companies;
    }

    Company load(UUID companyId) {
        return companies.findById(companyId).orElseThrow(() -> CompanyErrors.notFound(companyId));
    }

    Company load(UUID companyId, long expectedVersion) {
        Company company = load(companyId);
        if (company.version() != expectedVersion) {
            throw new OptimisticLockingFailureException("Company " + companyId + " was modified concurrently");
        }
        return company;
    }

    void requireUniqueName(String name, UUID excludedId) {
        if (name != null && companies.existsByNameIgnoreCase(name.strip(), excludedId)) {
            throw CompanyErrors.nameAlreadyUsed();
        }
    }
}
