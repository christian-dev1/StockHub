package com.stockhub.user.application.dto;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.model.UserStatus;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserView(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        RoleCode role,
        boolean allLocations,
        Set<UUID> locationIds,
        UserStatus status,
        boolean mustChangePassword,
        Instant lastLoginAt,
        long version) {

    public static UserView from(User user) {
        return new UserView(user.id(), user.email().value(), user.name().firstName(), user.name().lastName(),
                user.phone(), user.role(), user.allLocations(), user.locationIds(), user.status(),
                user.mustChangePassword(), user.lastLoginAt(), user.version());
    }

    /** Audit snapshot: never contains the password hash. */
    public java.util.Map<String, Object> auditSnapshot() {
        return java.util.Map.of("email", email, "role", role, "status", status,
                "allLocations", allLocations, "locationIds", locationIds);
    }
}
