package com.stockhub.user.application.command;

import java.util.Set;
import java.util.UUID;

public record AssignLocationsCommand(UUID userId, boolean allLocations, Set<UUID> locationIds) {
}
