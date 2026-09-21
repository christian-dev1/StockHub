package com.stockhub.warehouse.infrastructure.persistence;

import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.model.LocationAddress;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
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
        copy(location, entity);
        jpa.saveAndFlush(entity);
    }

    /** Flushes immediately so that the "single primary" unique index is checked statement by statement. */
    @Override
    public void save(Location location) {
        LocationJpaEntity entity = jpa.findByIdAndCompanyIdAndDeletedAtIsNull(location.id(), location.companyId())
                .orElseThrow(() -> new ObjectOptimisticLockingFailureException(LocationJpaEntity.class, location.id()));
        if (entity.version != location.version()) {
            throw new ObjectOptimisticLockingFailureException(LocationJpaEntity.class, location.id());
        }
        copy(location, entity);
        jpa.saveAndFlush(entity);
    }

    @Override
    public Optional<Location> findById(UUID companyId, UUID id) {
        return jpa.findByIdAndCompanyIdAndDeletedAtIsNull(id, companyId).map(JpaLocationRepository::toDomain);
    }

    @Override
    public Optional<Location> findPrimary(UUID companyId) {
        return jpa.findByCompanyIdAndPrimaryTrue(companyId).map(JpaLocationRepository::toDomain);
    }

    @Override
    public boolean existsByCode(UUID companyId, String code, UUID excludedId) {
        return jpa.existsByCode(companyId, code, excludedId);
    }

    @Override
    public List<Location> findAllByCompany(UUID companyId) {
        return jpa.findByCompanyIdAndDeletedAtIsNullOrderByPrimaryDescNameAsc(companyId).stream()
                .map(JpaLocationRepository::toDomain).toList();
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

    private static void copy(Location location, LocationJpaEntity entity) {
        entity.code = location.code();
        entity.name = location.name();
        entity.type = location.type();
        entity.addressLine = location.address().addressLine();
        entity.city = location.address().city();
        entity.phone = location.address().phone();
        entity.primary = location.isPrimary();
        entity.active = location.isActive();
    }

    private static Location toDomain(LocationJpaEntity e) {
        return new Location(e.id, e.companyId, e.code, e.name, e.type,
                new LocationAddress(e.addressLine, e.city, e.phone), e.primary, e.active, e.version);
    }
}
