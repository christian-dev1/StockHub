package com.stockhub.user.domain.repository;

import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.model.UserStatus;
import com.stockhub.user.domain.valueobject.Email;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    /** Unscoped lookup, reserved for authentication. */
    Optional<User> findById(UUID id);

    /** Tenant-scoped lookup: users of other companies are invisible. */
    Optional<User> findInCompany(UUID companyId, UUID userId);

    Optional<User> findByEmail(Email email);

    boolean existsByEmail(Email email);

    long countActiveAdmins(UUID companyId);

    /** Technical update that does not bump the aggregate version (no false edit conflicts). */
    void updateLastLogin(UUID userId, java.time.Instant at);

    /** Inserts or updates; fails with an optimistic-locking error on a stale version. */
    void save(User user);

    PageResult<User> search(UUID companyId, UserSearchCriteria criteria, PageQuery page);

    record UserSearchCriteria(String text, RoleCode role, UserStatus status) {
    }
}
