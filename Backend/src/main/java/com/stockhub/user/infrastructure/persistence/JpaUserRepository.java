package com.stockhub.user.infrastructure.persistence;

import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.model.UserStatus;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.valueobject.Email;
import com.stockhub.user.domain.valueobject.LocationAssignment;
import com.stockhub.user.domain.valueobject.PersonName;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

@Repository
class JpaUserRepository implements UserRepository {

    private static final Map<String, String> SORTABLE = Map.of(
            "email", "email", "lastName", "lastName", "role", "role", "status", "status",
            "lastLoginAt", "lastLoginAt", "createdAt", "createdAt");

    private final UserJpaRepository jpa;

    JpaUserRepository(UserJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpa.findByIdAndDeletedAtIsNull(id).map(JpaUserRepository::toDomain);
    }

    @Override
    public Optional<User> findInCompany(UUID companyId, UUID userId) {
        return jpa.findByIdAndCompanyIdAndDeletedAtIsNull(userId, companyId).map(JpaUserRepository::toDomain);
    }

    @Override
    public Optional<User> findByEmail(Email email) {
        return jpa.findByEmailAndDeletedAtIsNull(email.value()).map(JpaUserRepository::toDomain);
    }

    @Override
    public boolean existsByEmail(Email email) {
        return jpa.existsByEmailAndDeletedAtIsNull(email.value());
    }

    @Override
    public long countActiveAdmins(UUID companyId) {
        return jpa.countByCompanyIdAndRoleAndStatusAndDeletedAtIsNull(companyId, RoleCode.ADMIN, UserStatus.ACTIVE);
    }

    @Override
    public void updateLastLogin(UUID userId, Instant at) {
        jpa.updateLastLogin(userId, at);
    }

    @Override
    public void save(User user) {
        UserJpaEntity entity = jpa.findById(user.id()).orElseGet(UserJpaEntity::new);
        if (entity.id != null && entity.version != user.version()) {
            throw new ObjectOptimisticLockingFailureException(UserJpaEntity.class, user.id());
        }
        entity.id = user.id();
        entity.companyId = user.companyId();
        entity.email = user.email().value();
        entity.passwordHash = user.passwordHash();
        entity.firstName = user.name().firstName();
        entity.lastName = user.name().lastName();
        entity.phone = user.phone();
        entity.role = user.role();
        entity.allLocations = user.allLocations();
        entity.locationIds.clear();
        entity.locationIds.addAll(user.locationIds());
        entity.status = user.status();
        entity.mustChangePassword = user.mustChangePassword();
        entity.tokenVersion = user.tokenVersion();
        entity.lastLoginAt = user.lastLoginAt();
        jpa.saveAndFlush(entity);
    }

    @Override
    public PageResult<User> search(UUID companyId, UserSearchCriteria criteria, PageQuery page) {
        String sortField = SORTABLE.getOrDefault(page.sortField(), "lastName");
        Sort sort = Sort.by(page.ascending() ? Sort.Direction.ASC : Sort.Direction.DESC, sortField)
                .and(Sort.by("id"));
        Page<UserJpaEntity> result = jpa.findAll(matching(companyId, criteria), PageRequest.of(page.page(), page.size(), sort));
        return new PageResult<>(result.map(JpaUserRepository::toDomain).getContent(), page.page(), page.size(),
                result.getTotalElements());
    }

    private static Specification<UserJpaEntity> matching(UUID companyId, UserSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (criteria.text() != null && !criteria.text().isBlank()) {
                String like = "%" + criteria.text().strip().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), like, '\\'),
                        cb.like(cb.lower(root.get("firstName")), like, '\\'),
                        cb.like(cb.lower(root.get("lastName")), like, '\\')));
            }
            if (criteria.role() != null) {
                predicates.add(cb.equal(root.get("role"), criteria.role()));
            }
            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static User toDomain(UserJpaEntity e) {
        return User.builder()
                .id(e.id).companyId(e.companyId).email(new Email(e.email)).passwordHash(e.passwordHash)
                .name(new PersonName(e.firstName, e.lastName)).phone(e.phone).role(e.role)
                .locations(e.allLocations ? LocationAssignment.ALL : new LocationAssignment(false, new HashSet<>(e.locationIds)))
                .status(e.status).mustChangePassword(e.mustChangePassword).tokenVersion(e.tokenVersion)
                .lastLoginAt(e.lastLoginAt).version(e.version)
                .build();
    }
}
