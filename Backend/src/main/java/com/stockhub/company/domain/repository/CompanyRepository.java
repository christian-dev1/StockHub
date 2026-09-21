package com.stockhub.company.domain.repository;

import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.model.CompanyStatus;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository {

    Optional<Company> findById(UUID id);

    boolean existsByNameIgnoreCase(String name, UUID excludedId);

    void save(Company company);

    PageResult<Company> search(String text, CompanyStatus status, PageQuery page);
}
