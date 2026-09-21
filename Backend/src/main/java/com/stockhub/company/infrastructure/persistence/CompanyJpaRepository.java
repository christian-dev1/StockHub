package com.stockhub.company.infrastructure.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CompanyJpaRepository extends JpaRepository<CompanyJpaEntity, UUID>, JpaSpecificationExecutor<CompanyJpaEntity> {

    @Query("""
            select count(c) > 0 from CompanyJpaEntity c
            where lower(c.name) = lower(:name) and (:excluded is null or c.id <> :excluded)""")
    boolean existsByNameIgnoreCase(@Param("name") String name, @Param("excluded") UUID excluded);
}
