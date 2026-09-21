package com.stockhub.supplier.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface SupplierJpaRepository extends JpaRepository<SupplierJpaEntity, UUID>, JpaSpecificationExecutor<SupplierJpaEntity> {

    Optional<SupplierJpaEntity> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);

    @Query("""
            select s from SupplierJpaEntity s
            where s.companyId = :companyId and lower(s.code) = lower(:code) and s.deletedAt is null""")
    Optional<SupplierJpaEntity> findByCode(@Param("companyId") UUID companyId, @Param("code") String code);

    List<SupplierJpaEntity> findByCompanyIdAndIdInAndDeletedAtIsNull(UUID companyId, Collection<UUID> ids);

    @Query("""
            select count(s) > 0 from SupplierJpaEntity s
            where s.companyId = :companyId and lower(s.code) = lower(:code) and s.deletedAt is null
              and (:excludedId is null or s.id <> :excludedId)""")
    boolean existsByCode(@Param("companyId") UUID companyId, @Param("code") String code,
                         @Param("excludedId") UUID excludedId);
}
