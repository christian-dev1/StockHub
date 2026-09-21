package com.stockhub.warehouse.domain.repository;

import com.stockhub.warehouse.domain.model.Location;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Every query is scoped by company: there is no way to read another tenant's locations. */
public interface LocationRepository {

    void add(Location location);

    void save(Location location);

    Optional<Location> findById(UUID companyId, UUID id);

    Optional<Location> findPrimary(UUID companyId);

    boolean existsByCode(UUID companyId, String code, UUID excludedId);

    List<Location> findAllByCompany(UUID companyId);

    List<Location> findActiveByCompany(UUID companyId);

    List<Location> findByCompanyAndIds(UUID companyId, Collection<UUID> ids);
}
