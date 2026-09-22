package com.stockhub.dashboard.application.usecase;

import com.stockhub.dashboard.application.dto.DashboardViews.*;
import com.stockhub.dashboard.application.port.DashboardReadModel;
import com.stockhub.dashboard.domain.model.DashboardPeriod;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;

/**
 * Health of the whole platform for the super admin. Days are UTC days: the platform spans
 * companies of several time zones.
 */
@Service
@Transactional(readOnly = true)
public class PlatformDashboardQueries {

    /** Administrative actions worth showing; logins and catalogue edits are left out. */
    static final Set<String> IMPORTANT_ACTIONS =
            Set.of(
                    "COMPANY_CREATED",
                    "COMPANY_UPDATED",
                    "COMPANY_DISABLED",
                    "COMPANY_ENABLED",
                    "COMPANY_SETTINGS_UPDATED",
                    "USER_CREATED",
                    "USER_DISABLED",
                    "USER_ENABLED",
                    "USER_ROLE_CHANGED",
                    "USER_LOCATIONS_CHANGED",
                    "USER_PASSWORD_RESET",
                    "LOCATION_CREATED",
                    "LOCATION_PRIMARY_CHANGED",
                    "REFRESH_TOKEN_REUSE_DETECTED",
                    "SUPER_ADMIN_BOOTSTRAPPED");

    private static final int RECENT_EVENTS = 10;

    private final DashboardReadModel readModel;
    private final Clock clock;

    public PlatformDashboardQueries(DashboardReadModel readModel, Clock clock) {
        this.readModel = readModel;
        this.clock = clock;
    }

    public PlatformDashboard dashboard(String periodCode, LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        DashboardPeriod period = DashboardPeriod.of(periodCode, from, to, today);
        return new PlatformDashboard(
                Period.of(period),
                readModel.platformTotals(
                        today.atStartOfDay(ZoneOffset.UTC).toInstant(),
                        today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()),
                readModel.platformActivity(period),
                readModel.recentAuditEvents(IMPORTANT_ACTIONS, RECENT_EVENTS));
    }
}
