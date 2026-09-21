package com.stockhub.auth.application.dto;

import com.stockhub.company.CompanySnapshot;
import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.warehouse.LocationSummary;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** The authenticated user's profile, rights and company context. */
public record SessionView(
        UUID userId,
        String email,
        String firstName,
        String lastName,
        RoleCode role,
        Set<Permission> permissions,
        boolean mustChangePassword,
        boolean allLocations,
        List<LocationSummary> locations,
        CompanySnapshot company) {
}
