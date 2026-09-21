package com.stockhub.warehouse.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.warehouse.application.dto.LocationView;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Moves the "primary" flag atomically: the former primary is demoted first so
 * that the database invariant (one primary per company) holds at every statement.
 */
@Service
public class SetPrimaryLocationUseCase {

    private final LocationRepository locations;
    private final LocationAccess access;
    private final AuditRecorder audit;

    SetPrimaryLocationUseCase(LocationRepository locations, LocationAccess access, AuditRecorder audit) {
        this.locations = locations;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public LocationView execute(UUID locationId) {
        Location target = access.load(locationId);
        if (target.isPrimary()) {
            return LocationView.from(target);
        }
        target.makePrimary();
        Location former = locations.findPrimary(target.companyId()).orElse(null);
        if (former != null) {
            former.demote();
            locations.save(former);
        }
        locations.save(target);
        audit.record(AuditEntry.of("LOCATION_PRIMARY_CHANGED", "Location", target.id())
                .withMetadata(former == null ? Map.of() : Map.of("previousPrimaryId", former.id().toString())));
        return LocationView.from(target);
    }
}
