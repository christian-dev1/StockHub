package com.stockhub.auth.presentation.response;

import com.stockhub.auth.application.dto.SessionView;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.warehouse.LocationSummary;
import java.util.List;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        RoleCode role,
        List<Permission> permissions,
        boolean mustChangePassword,
        boolean allLocations,
        List<Location> locations,
        Company company) {

    public record Location(UUID id, String code, String name, String type, boolean primary) {
    }

    public record Company(UUID id, String name, String currency, String timezone, String locale,
                          boolean allowNegativeStock, int expiryWarningDays) {
    }

    public static SessionResponse from(SessionView v) {
        CompanySnapshot c = v.company();
        return new SessionResponse(v.userId(), v.email(), v.firstName(), v.lastName(), v.role(),
                v.permissions().stream().sorted().toList(), v.mustChangePassword(), v.allLocations(),
                v.locations().stream().map(SessionResponse::toLocation).toList(),
                c == null ? null : new Company(c.id(), c.name(), c.currency(), c.timezone(), c.locale(),
                        c.allowNegativeStock(), c.expiryWarningDays()));
    }

    private static Location toLocation(LocationSummary l) {
        return new Location(l.id(), l.code(), l.name(), l.type(), l.primary());
    }
}
