package com.stockhub.user.application.command;

import com.stockhub.shared.security.RoleCode;
import java.util.Set;
import java.util.UUID;

public record CreateUserCommand(
        String email,
        String firstName,
        String lastName,
        String phone,
        RoleCode role,
        boolean allLocations,
        Set<UUID> locationIds,
        String temporaryPassword) {
}
