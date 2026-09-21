package com.stockhub.warehouse.application.usecase;

import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.LocationAccessPolicy;
import com.stockhub.shared.security.Permission;
import com.stockhub.warehouse.application.dto.LocationView;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Location reads for the current user. Inactive locations are only listed to
 * users who manage locations; everybody else only sees the locations granted.
 */
@Service
@Transactional(readOnly = true)
public class LocationQueries {

    private final LocationRepository locations;
    private final LocationAccess access;
    private final LocationAccessPolicy accessPolicy;

    LocationQueries(LocationRepository locations, LocationAccess access, LocationAccessPolicy accessPolicy) {
        this.locations = locations;
        this.access = access;
        this.accessPolicy = accessPolicy;
    }

    public List<LocationView> list(boolean includeInactive) {
        CurrentUser user = access.actor();
        UUID companyId = user.requireCompanyId();
        boolean withInactive = includeInactive && user.has(Permission.WAREHOUSE_UPDATE);
        List<Location> found = withInactive ? locations.findAllByCompany(companyId) : locations.findActiveByCompany(companyId);
        return found.stream()
                .filter(location -> user.canAccessLocation(location.id()))
                .map(LocationView::from)
                .toList();
    }

    public LocationView get(UUID locationId) {
        Location location = access.load(locationId);
        accessPolicy.requireAccess(location.id());
        return LocationView.from(location);
    }
}
