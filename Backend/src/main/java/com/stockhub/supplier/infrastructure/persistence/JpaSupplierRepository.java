package com.stockhub.supplier.infrastructure.persistence;

import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.shared.infrastructure.persistence.LikePatterns;
import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.repository.SupplierRepository;
import com.stockhub.supplier.domain.valueobject.SupplierContact;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

@Repository
class JpaSupplierRepository implements SupplierRepository {

    private static final Map<String, String> SORTABLE = Map.of("code", "code", "name", "name", "city", "city",
            "leadTimeDays", "leadTimeDays", "createdAt", "createdAt");

    private final SupplierJpaRepository jpa;

    JpaSupplierRepository(SupplierJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(Supplier supplier) {
        SupplierJpaEntity e = jpa.findById(supplier.id()).orElseGet(SupplierJpaEntity::new);
        if (e.id != null && (e.version != supplier.version() || !e.companyId.equals(supplier.companyId()))) {
            throw new ObjectOptimisticLockingFailureException(SupplierJpaEntity.class, supplier.id());
        }
        e.id = supplier.id();
        e.companyId = supplier.companyId();
        e.code = supplier.code();
        e.name = supplier.name();
        e.contactName = supplier.contact().contactName();
        e.email = supplier.contact().email();
        e.phone = supplier.contact().phone();
        e.addressLine = supplier.contact().addressLine();
        e.city = supplier.contact().city();
        e.country = supplier.contact().country();
        e.taxId = supplier.taxId();
        e.leadTimeDays = supplier.leadTimeDays();
        e.notes = supplier.notes();
        e.active = supplier.isActive();
        jpa.saveAndFlush(e);
    }

    @Override
    public Optional<Supplier> findById(UUID companyId, UUID id) {
        return jpa.findByIdAndCompanyIdAndDeletedAtIsNull(id, companyId).map(JpaSupplierRepository::toDomain);
    }

    @Override
    public Optional<Supplier> findByCode(UUID companyId, String code) {
        return jpa.findByCode(companyId, code.strip()).map(JpaSupplierRepository::toDomain);
    }

    @Override
    public List<Supplier> findByIds(UUID companyId, Collection<UUID> ids) {
        return jpa.findByCompanyIdAndIdInAndDeletedAtIsNull(companyId, ids).stream()
                .map(JpaSupplierRepository::toDomain).toList();
    }

    @Override
    public boolean existsByCode(UUID companyId, String code, UUID excludedId) {
        return jpa.existsByCode(companyId, code, excludedId);
    }

    @Override
    public PageResult<Supplier> search(UUID companyId, String text, Boolean active, PageQuery page) {
        Specification<SupplierJpaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (text != null && !text.isBlank()) {
                String like = LikePatterns.contains(text);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like, LikePatterns.ESCAPE),
                        cb.like(cb.lower(root.get("code")), like, LikePatterns.ESCAPE),
                        cb.like(cb.lower(cb.coalesce(root.get("contactName"), "")), like, LikePatterns.ESCAPE),
                        cb.like(cb.lower(cb.coalesce(root.get("email"), "")), like, LikePatterns.ESCAPE),
                        cb.like(cb.lower(cb.coalesce(root.get("city"), "")), like, LikePatterns.ESCAPE)));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Sort sort = Sort.by(page.ascending() ? Sort.Direction.ASC : Sort.Direction.DESC,
                SORTABLE.getOrDefault(page.sortField(), "name")).and(Sort.by("id"));
        var result = jpa.findAll(spec, PageRequest.of(page.page(), page.size(), sort));
        return new PageResult<>(result.map(JpaSupplierRepository::toDomain).getContent(), page.page(), page.size(),
                result.getTotalElements());
    }

    private static Supplier toDomain(SupplierJpaEntity e) {
        return new Supplier(e.id, e.companyId, e.code, e.name,
                new SupplierContact(e.contactName, e.email, e.phone, e.addressLine, e.city, e.country),
                e.taxId, e.leadTimeDays, e.notes, e.active, e.version);
    }
}
