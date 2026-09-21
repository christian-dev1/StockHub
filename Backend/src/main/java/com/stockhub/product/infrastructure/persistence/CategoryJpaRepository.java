package com.stockhub.product.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CategoryJpaRepository extends JpaRepository<CategoryJpaEntity, UUID> {

    Optional<CategoryJpaEntity> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);

    List<CategoryJpaEntity> findByCompanyIdAndDeletedAtIsNull(UUID companyId);

    List<CategoryJpaEntity> findByCompanyIdAndIdInAndDeletedAtIsNull(UUID companyId, Collection<UUID> ids);

    @Query("""
            select c from CategoryJpaEntity c
            where c.companyId = :companyId and lower(c.name) = lower(:name) and c.deletedAt is null""")
    Optional<CategoryJpaEntity> findByName(@Param("companyId") UUID companyId, @Param("name") String name);

    @Query("""
            select count(c) > 0 from CategoryJpaEntity c
            where c.companyId = :companyId and lower(c.name) = lower(:name) and c.deletedAt is null
              and (:excludedId is null or c.id <> :excludedId)""")
    boolean existsByName(@Param("companyId") UUID companyId, @Param("name") String name,
                         @Param("excludedId") UUID excludedId);

    boolean existsByCompanyIdAndParentIdAndDeletedAtIsNull(UUID companyId, UUID parentId);
}
