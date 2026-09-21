package com.stockhub.user.infrastructure.persistence;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.UserStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID>, JpaSpecificationExecutor<UserJpaEntity> {

    Optional<UserJpaEntity> findByIdAndDeletedAtIsNull(UUID id);

    Optional<UserJpaEntity> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);

    Optional<UserJpaEntity> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    long countByCompanyIdAndRoleAndStatusAndDeletedAtIsNull(UUID companyId, RoleCode role, UserStatus status);

    @Modifying
    @Query("update UserJpaEntity u set u.lastLoginAt = :at where u.id = :id")
    void updateLastLogin(@Param("id") UUID id, @Param("at") Instant at);
}
