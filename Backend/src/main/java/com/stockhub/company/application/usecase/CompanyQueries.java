package com.stockhub.company.application.usecase;

import com.stockhub.company.CompanyApi;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.company.application.dto.CompanyView;
import com.stockhub.company.application.query.CompanySearchQuery;
import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.repository.CompanyRepository;
import com.stockhub.shared.application.CacheNames;
import com.stockhub.shared.domain.page.PageResult;
import java.util.Optional;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompanyQueries implements CompanyApi {

    private final CompanyRepository companies;
    private final CompanyLoader loader;

    CompanyQueries(CompanyRepository companies, CompanyLoader loader) {
        this.companies = companies;
        this.loader = loader;
    }

    public PageResult<CompanyView> search(CompanySearchQuery query) {
        return companies.search(query.text(), query.status(), query.page()).map(CompanyView::from);
    }

    public CompanyView get(UUID companyId) {
        return CompanyView.from(loader.load(companyId));
    }

    @Override
    public Optional<CompanySnapshot> find(UUID companyId) {
        return companies.findById(companyId).map(CompanyQueries::toSnapshot);
    }

    @Override
    @Cacheable(cacheNames = CacheNames.COMPANY_STATUS)
    public boolean isActive(UUID companyId) {
        return companies.findById(companyId).map(Company::isActive).orElse(false);
    }

    private static CompanySnapshot toSnapshot(Company c) {
        return new CompanySnapshot(c.id(), c.name(), c.localization().currency(), c.localization().timezone(),
                c.localization().locale(), c.isActive(), c.settings().allowNegativeStock(),
                c.settings().expiryWarningDays(), c.settings().defaultLeadTimeDays());
    }
}
