package com.stockhub.shared.security;

import com.stockhub.shared.domain.exception.ForbiddenException;
import java.util.Collection;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Restricts operations to the locations a user has been granted. Tenant
 * ownership of the location itself is checked by the owning module.
 */
@Component
public class LocationAccessPolicy {

    private final CurrentUserProvider currentUser;

    public LocationAccessPolicy(CurrentUserProvider currentUser) {
        this.currentUser = currentUser;
    }

    public void requireAccess(UUID locationId) {
        if (!currentUser.require().canAccessLocation(locationId)) {
            throw new ForbiddenException("LOCATION_ACCESS_DENIED", "You do not have access to this location.");
        }
    }

    public void requireAccess(Collection<UUID> locationIds) {
        locationIds.forEach(this::requireAccess);
    }
}
