package com.stockhub.warehouse.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface LocationJpaRepository extends JpaRepository<LocationJpaEntity, UUID> {

    Optional<LocationJpaEntity> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);

    Optional<LocationJpaEntity> findByCompanyIdAndPrimaryTrue(UUID companyId);

    @Query("""
            select count(l) > 0 from LocationJpaEntity l
            where l.companyId = :companyId and lower(l.code) = lower(:code) and l.deletedAt is null
              and (:excludedId is null or l.id <> :excludedId)
            """)
    boolean existsByCode(@Param("companyId") UUID companyId, @Param("code") String code,
                         @Param("excludedId") UUID excludedId);

    List<LocationJpaEntity> findByCompanyIdAndDeletedAtIsNullOrderByPrimaryDescNameAsc(UUID companyId);

    List<LocationJpaEntity> findByCompanyIdAndActiveTrueAndDeletedAtIsNullOrderByPrimaryDescNameAsc(UUID companyId);

    List<LocationJpaEntity> findByCompanyIdAndIdInAndDeletedAtIsNull(UUID companyId, Collection<UUID> ids);
}
