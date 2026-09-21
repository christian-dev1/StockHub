package com.stockhub.user;

import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import java.util.Set;
import java.util.UUID;

/** Everything needed to authorize a request for a user, resolved from the database. */
public record UserAuthorities(
        UUID userId,
        UUID companyId,
        String email,
        String firstName,
        String lastName,
        RoleCode role,
        Set<Permission> permissions,
        boolean allLocations,
        Set<UUID> locationIds,
        boolean active,
        boolean mustChangePassword,
        int tokenVersion) {
}
