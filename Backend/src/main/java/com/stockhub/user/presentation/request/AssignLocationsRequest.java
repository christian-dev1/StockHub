package com.stockhub.user.presentation.request;

import java.util.Set;
import java.util.UUID;

public record AssignLocationsRequest(Boolean allLocations, Set<UUID> locationIds) {
}
