package com.stockhub.warehouse.application.usecase;

import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.warehouse.domain.exception.LocationErrors;
import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.repository.LocationRepository;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

/** Tenant-scoped loading and uniqueness checks shared by the location use cases. */
@Component
class LocationAccess {

    private final LocationRepository locations;
    private final CurrentUserProvider currentUser;

    LocationAccess(LocationRepository locations, CurrentUserProvider currentUser) {
        this.locations = locations;
        this.currentUser = currentUser;
    }

    CurrentUser actor() {
        return currentUser.require();
    }

    UUID companyId() {
        return actor().requireCompanyId();
    }

    /** A location of another company does not exist for the caller (404). */
    Location load(UUID locationId) {
        return locations.findById(companyId(), locationId).orElseThrow(() -> LocationErrors.notFound(locationId));
    }

    Location load(UUID locationId, long expectedVersion) {
        Location location = load(locationId);
        if (location.version() != expectedVersion) {
            throw new OptimisticLockingFailureException("Location " + locationId + " was modified concurrently");
        }
        return location;
    }

    void requireUniqueCode(String code, UUID excludedId) {
        if (code != null && locations.existsByCode(companyId(), code.strip(), excludedId)) {
            throw LocationErrors.codeAlreadyUsed();
        }
    }
}
