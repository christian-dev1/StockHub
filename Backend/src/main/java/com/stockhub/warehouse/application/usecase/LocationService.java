package com.stockhub.warehouse.application.usecase;

import com.stockhub.warehouse.LocationApi;
import com.stockhub.warehouse.LocationSummary;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Implements the cross-module API; full location management arrives with the catalogue phase. */
@Service
class LocationService implements LocationApi {

    static final String PRIMARY_SUFFIX = "Principal";

    private final LocationRepository locations;

    LocationService(LocationRepository locations) {
        this.locations = locations;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID createPrimaryLocation(UUID companyId, String companyName) {
        Location primary = Location.primaryFor(companyId, companyName, PRIMARY_SUFFIX);
        locations.add(primary);
        return primary.id();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<UUID> findActiveIds(UUID companyId, Collection<UUID> locationIds) {
        if (locationIds.isEmpty()) {
            return Set.of();
        }
        return locations.findByCompanyAndIds(companyId, locationIds).stream()
                .filter(Location::isActive)
                .map(Location::id)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationSummary> findByIds(UUID companyId, Collection<UUID> locationIds) {
        if (locationIds.isEmpty()) {
            return List.of();
        }
        return locations.findByCompanyAndIds(companyId, locationIds).stream().map(LocationService::toSummary).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationSummary> findAllActive(UUID companyId) {
        return locations.findActiveByCompany(companyId).stream().map(LocationService::toSummary).toList();
    }

    static LocationSummary toSummary(Location location) {
        return new LocationSummary(location.id(), location.code(), location.name(), location.type().name(),
                location.isPrimary(), location.isActive());
    }
}
