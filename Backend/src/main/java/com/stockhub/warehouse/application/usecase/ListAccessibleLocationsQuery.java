package com.stockhub.warehouse.application.usecase;

import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.warehouse.LocationSummary;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Active locations of the current company that the current user may work with. */
@Service
public class ListAccessibleLocationsQuery {

    private final LocationRepository locations;
    private final CurrentUserProvider currentUser;

    ListAccessibleLocationsQuery(LocationRepository locations, CurrentUserProvider currentUser) {
        this.locations = locations;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<LocationSummary> execute() {
        CurrentUser user = currentUser.require();
        return locations.findActiveByCompany(user.requireCompanyId()).stream()
                .filter(location -> user.canAccessLocation(location.id()))
                .map(LocationService::toSummary)
                .toList();
    }
}
