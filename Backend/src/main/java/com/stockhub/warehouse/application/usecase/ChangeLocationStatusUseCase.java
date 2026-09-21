package com.stockhub.warehouse.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.warehouse.LocationDeactivationGuard;
import com.stockhub.warehouse.application.dto.LocationView;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Activates or deactivates a location. Deactivation is refused for the primary
 * location and whenever another module vetoes it (see {@link LocationDeactivationGuard}).
 */
@Service
public class ChangeLocationStatusUseCase {

    private final LocationRepository locations;
    private final LocationAccess access;
    private final List<LocationDeactivationGuard> guards;
    private final AuditRecorder audit;

    ChangeLocationStatusUseCase(LocationRepository locations, LocationAccess access,
                                List<LocationDeactivationGuard> guards, AuditRecorder audit) {
        this.locations = locations;
        this.access = access;
        this.guards = guards;
        this.audit = audit;
    }

    @Transactional
    public LocationView deactivate(UUID locationId) {
        Location location = access.load(locationId);
        location.deactivate();
        guards.forEach(guard -> guard.checkDeactivation(location.companyId(), location.id()));
        return persist(location, "LOCATION_DISABLED");
    }

    @Transactional
    public LocationView activate(UUID locationId) {
        Location location = access.load(locationId);
        location.activate();
        return persist(location, "LOCATION_ENABLED");
    }

    private LocationView persist(Location location, String action) {
        locations.save(location);
        audit.record(AuditEntry.of(action, "Location", location.id()));
        return LocationView.from(location);
    }
}
