package com.stockhub.user.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Set;
import java.util.UUID;

/** Either every location of the company, or an explicit non-empty subset. */
public record LocationAssignment(boolean allLocations, Set<UUID> locationIds) {

    public static final LocationAssignment ALL = new LocationAssignment(true, Set.of());

    public LocationAssignment {
        locationIds = allLocations || locationIds == null ? Set.of() : Set.copyOf(locationIds);
        if (!allLocations && locationIds.isEmpty()) {
            throw new InvalidInputException("locationIds", "USER_LOCATIONS_REQUIRED",
                    "At least one location must be assigned.");
        }
    }
}
