package com.stockhub.warehouse.infrastructure.persistence;

import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
class JpaLocationRepository implements LocationRepository {

    private final LocationJpaRepository jpa;

    JpaLocationRepository(LocationJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void add(Location location) {
        LocationJpaEntity entity = new LocationJpaEntity();
        entity.id = location.id();
        entity.companyId = location.companyId();
        entity.code = location.code();
        entity.name = location.name();
        entity.type = location.type();
        entity.primary = location.isPrimary();
        entity.active = location.isActive();
        jpa.save(entity);
    }

    @Override
    public List<Location> findActiveByCompany(UUID companyId) {
        return jpa.findByCompanyIdAndActiveTrueAndDeletedAtIsNullOrderByPrimaryDescNameAsc(companyId).stream()
                .map(JpaLocationRepository::toDomain).toList();
    }

    @Override
    public List<Location> findByCompanyAndIds(UUID companyId, Collection<UUID> ids) {
        return jpa.findByCompanyIdAndIdInAndDeletedAtIsNull(companyId, ids).stream()
                .map(JpaLocationRepository::toDomain).toList();
    }

    private static Location toDomain(LocationJpaEntity e) {
        return new Location(e.id, e.companyId, e.code, e.name, e.type, e.primary, e.active, e.version);
    }
}
