package com.stockhub.user.presentation.response;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.domain.model.UserStatus;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
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

    public static UserResponse from(UserView v) {
        return new UserResponse(v.id(), v.email(), v.firstName(), v.lastName(), v.phone(), v.role(),
                v.allLocations(), v.locationIds(), v.status(), v.mustChangePassword(), v.lastLoginAt(), v.version());
    }
}
