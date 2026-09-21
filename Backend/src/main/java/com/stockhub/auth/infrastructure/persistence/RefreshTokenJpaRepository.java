package com.stockhub.auth.infrastructure.persistence;

import com.stockhub.auth.domain.model.RefreshToken.RevokeReason;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RefreshTokenJpaRepository extends JpaRepository<RefreshTokenJpaEntity, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from RefreshTokenJpaEntity t where t.tokenHash = :hash")
    Optional<RefreshTokenJpaEntity> findByHashForUpdate(@Param("hash") String hash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update RefreshTokenJpaEntity t set t.revokedAt = :now, t.revokeReason = :reason
            where t.familyId = :family and t.revokedAt is null""")
    int revokeFamily(@Param("family") UUID family, @Param("reason") RevokeReason reason, @Param("now") Instant now);
}
