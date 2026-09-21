package com.stockhub.company.infrastructure.persistence;

import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.model.CompanyStatus;
import com.stockhub.company.domain.repository.CompanyRepository;
import com.stockhub.company.domain.valueobject.CompanyContact;
import com.stockhub.company.domain.valueobject.CompanySettings;
import com.stockhub.company.domain.valueobject.Localization;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

@Repository
class JpaCompanyRepository implements CompanyRepository {

    private static final Map<String, String> SORTABLE = Map.of("name", "name", "status", "status", "createdAt", "createdAt");

    private final CompanyJpaRepository jpa;

    JpaCompanyRepository(CompanyJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<Company> findById(UUID id) {
        return jpa.findById(id).map(JpaCompanyRepository::toDomain);
    }

    @Override
    public boolean existsByNameIgnoreCase(String name, UUID excludedId) {
        return jpa.existsByNameIgnoreCase(name, excludedId);
    }

    @Override
    public void save(Company company) {
        CompanyJpaEntity e = jpa.findById(company.id()).orElseGet(CompanyJpaEntity::new);
        if (e.id != null && e.version != company.version()) {
            throw new ObjectOptimisticLockingFailureException(CompanyJpaEntity.class, company.id());
        }
        e.id = company.id();
        e.name = company.name();
        e.legalName = company.legalName();
        e.email = company.contact().email();
        e.phone = company.contact().phone();
        e.addressLine = company.contact().addressLine();
        e.city = company.contact().city();
        e.country = company.contact().country();
        e.currency = company.localization().currency();
        e.timezone = company.localization().timezone();
        e.locale = company.localization().locale();
        e.status = company.status();
        e.allowNegativeStock = company.settings().allowNegativeStock();
        e.expiryWarningDays = company.settings().expiryWarningDays();
        e.defaultLeadTimeDays = company.settings().defaultLeadTimeDays();
        jpa.saveAndFlush(e);
    }

    @Override
    public PageResult<Company> search(String text, CompanyStatus status, PageQuery page) {
        Specification<CompanyJpaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (text != null && !text.isBlank()) {
                String like = "%" + text.strip().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("name")), like, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.get("email"), "")), like, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.get("city"), "")), like, '\\')));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Sort sort = Sort.by(page.ascending() ? Sort.Direction.ASC : Sort.Direction.DESC,
                SORTABLE.getOrDefault(page.sortField(), "name")).and(Sort.by("id"));
        var result = jpa.findAll(spec, PageRequest.of(page.page(), page.size(), sort));
        return new PageResult<>(result.map(JpaCompanyRepository::toDomain).getContent(), page.page(), page.size(),
                result.getTotalElements());
    }

    private static Company toDomain(CompanyJpaEntity e) {
        return new Company(e.id, e.name, e.legalName,
                new CompanyContact(e.email, e.phone, e.addressLine, e.city, e.country),
                new Localization(e.currency, e.timezone, e.locale), e.status,
                new CompanySettings(e.allowNegativeStock, e.expiryWarningDays, e.defaultLeadTimeDays), e.version);
    }
}
