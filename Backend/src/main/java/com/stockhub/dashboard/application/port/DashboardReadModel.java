package com.stockhub.dashboard.application.port;

import com.stockhub.dashboard.application.dto.DashboardViews.*;
import com.stockhub.dashboard.domain.model.DashboardPeriod;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Aggregations computed by the database. */
public interface DashboardReadModel {

    /**
     * What a company dashboard may read.
     *
     * @param locations locations whose stock is counted; null means every location of the company
     * @param allowed locations the user may see; null means all of them
     * @param financial whether stock values may be computed
     */
    record CompanyScope(
            UUID companyId,
            Set<UUID> locations,
            Set<UUID> allowed,
            ZoneId zone,
            LocalDate today,
            int warningDays,
            boolean financial) {}

    /** Active location of the company, when it exists. */
    Optional<LocationRef> location(UUID companyId, UUID locationId);

    /** Active locations of the company, restricted to {@code allowed} when not null. */
    List<LocationRef> activeLocations(UUID companyId, Set<UUID> allowed);

    Catalogue catalogue(CompanyScope scope, String currency);

    StockStatus status(CompanyScope scope);

    BatchWatch batches(CompanyScope scope);

    OperationCounts operations(CompanyScope scope, Instant from, Instant to);

    List<LocationStock> byLocation(CompanyScope scope, List<LocationRef> locations);

    Attention attention(CompanyScope scope, int limit);

    List<FlowPoint> flow(CompanyScope scope, DashboardPeriod period);

    List<RecentOperation> recentOperations(CompanyScope scope, String type, int limit);

    List<MovedProduct> topMoved(CompanyScope scope, Instant from, Instant to, int limit);

    PlatformTotals platformTotals(Instant todayStart, Instant tomorrowStart);

    List<PlatformPoint> platformActivity(DashboardPeriod period);

    List<AuditEvent> recentAuditEvents(Set<String> actions, int limit);
}
