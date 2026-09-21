package com.stockhub.warehouse.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface LocationJpaRepository extends JpaRepository<LocationJpaEntity, UUID> {

    List<LocationJpaEntity> findByCompanyIdAndActiveTrueAndDeletedAtIsNullOrderByPrimaryDescNameAsc(UUID companyId);

    List<LocationJpaEntity> findByCompanyIdAndIdInAndDeletedAtIsNull(UUID companyId, Collection<UUID> ids);
}
