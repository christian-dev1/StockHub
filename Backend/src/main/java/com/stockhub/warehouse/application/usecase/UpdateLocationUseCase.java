package com.stockhub.warehouse.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.warehouse.application.command.LocationCommand;
import com.stockhub.warehouse.application.dto.LocationView;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.model.LocationAddress;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateLocationUseCase {

    private final LocationRepository locations;
    private final LocationAccess access;
    private final AuditRecorder audit;

    UpdateLocationUseCase(LocationRepository locations, LocationAccess access, AuditRecorder audit) {
        this.locations = locations;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public LocationView execute(UUID locationId, LocationCommand command, long version) {
        Location location = access.load(locationId, version);
        access.requireUniqueCode(command.code(), locationId);
        var before = LocationView.from(location).auditSnapshot();
        location.update(command.code(), command.name(), command.type(),
                new LocationAddress(command.addressLine(), command.city(), command.phone()));
        locations.save(location);
        LocationView view = LocationView.from(location);
        audit.record(AuditEntry.of("LOCATION_UPDATED", "Location", locationId).change(before, view.auditSnapshot()));
        return view;
    }
}
