package com.stockhub.warehouse.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.warehouse.application.command.LocationCommand;
import com.stockhub.warehouse.application.dto.LocationView;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.model.LocationAddress;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateLocationUseCase {

    private final LocationRepository locations;
    private final LocationAccess access;
    private final AuditRecorder audit;

    CreateLocationUseCase(LocationRepository locations, LocationAccess access, AuditRecorder audit) {
        this.locations = locations;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public LocationView execute(LocationCommand command) {
        access.requireUniqueCode(command.code(), null);
        Location location = Location.create(access.companyId(), command.code(), command.name(), command.type(),
                new LocationAddress(command.addressLine(), command.city(), command.phone()));
        locations.add(location);
        LocationView view = LocationView.from(location);
        audit.record(AuditEntry.of("LOCATION_CREATED", "Location", location.id()).change(null, view.auditSnapshot()));
        return view;
    }
}
