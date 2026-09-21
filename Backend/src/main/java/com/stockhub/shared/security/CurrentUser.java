package com.stockhub.shared.security;

import com.stockhub.shared.domain.exception.ForbiddenException;
import java.util.Set;
import java.util.UUID;

/**
 * Authenticated user as resolved <em>server side</em> for the current request.
 * The company comes from the verified token, never from request parameters.
 */
public record CurrentUser(
        UUID userId,
        UUID companyId,
        String email,
        RoleCode role,
        Set<Permission> permissions,
        boolean allLocations,
        Set<UUID> locationIds,
        boolean mustChangePassword) {

    public CurrentUser {
        permissions = Set.copyOf(permissions);
        locationIds = Set.copyOf(locationIds);
    }

    public boolean has(Permission permission) {
        return permissions.contains(permission);
    }

    public boolean isPlatformAdmin() {
        return role == RoleCode.SUPER_ADMIN;
    }

    /** Company of a tenant user; platform users have none and are refused here. */
    public UUID requireCompanyId() {
        if (companyId == null) {
            throw new ForbiddenException("COMPANY_CONTEXT_REQUIRED", "This operation requires a company context.");
        }
        return companyId;
    }

    public boolean canAccessLocation(UUID locationId) {
        return allLocations || locationIds.contains(locationId);
    }
}
