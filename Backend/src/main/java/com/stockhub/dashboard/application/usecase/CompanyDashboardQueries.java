package com.stockhub.dashboard.application.usecase;

import com.stockhub.company.CompanyApi;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.dashboard.application.dto.DashboardViews.*;
import com.stockhub.dashboard.application.port.DashboardReadModel;
import com.stockhub.dashboard.application.port.DashboardReadModel.CompanyScope;
import com.stockhub.dashboard.domain.model.DashboardPeriod;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.shared.security.LocationAccessPolicy;
import com.stockhub.shared.security.Permission;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Company dashboard. The company, the visible locations and the right to see stock values come
 * from the authenticated user; an optional location narrows the figures and must be one of his.
 */
@Service
@Transactional(readOnly = true)
public class CompanyDashboardQueries {

    /** Stock notes accepted by the recent-activity filter. */
    private static final Set<String> DOCUMENT_TYPES = Set.of("ENTRY", "EXIT", "ADJUSTMENT", "TRANSFER");

    private static final int ATTENTION_LIMIT = 5;
    private static final int MAX_RECENT = 20;
    private static final int MAX_TOP = 10;

    private final CurrentUserProvider currentUser;
    private final CompanyApi companies;
    private final LocationAccessPolicy locationAccess;
    private final DashboardReadModel readModel;
    private final Clock clock;

    public CompanyDashboardQueries(
            CurrentUserProvider currentUser,
            CompanyApi companies,
            LocationAccessPolicy locationAccess,
            DashboardReadModel readModel,
            Clock clock) {
        this.currentUser = currentUser;
        this.companies = companies;
        this.locationAccess = locationAccess;
        this.readModel = readModel;
        this.clock = clock;
    }

    /** Request parameters shared by every company dashboard endpoint. */
    public record Request(String period, LocalDate from, LocalDate to, UUID locationId) {}

    public Summary summary(Request request) {
        Context context = context(request);
        CompanyScope scope = context.scope();
        DashboardPeriod period = context.period();
        List<LocationRef> visible = readModel.activeLocations(scope.companyId(), context.allowed());
        boolean multiLocation = visible.size() > 1;
        // Comparing locations only makes sense on the all-locations view of a multi-site company.
        List<LocationStock> byLocation =
                multiLocation && request.locationId() == null
                        ? readModel.byLocation(scope, visible)
                        : List.of();
        Instant todayStart = startOf(scope.today(), scope.zone());
        return new Summary(
                Period.of(period),
                new Scope(request.locationId(), visible, multiLocation, scope.financial()),
                readModel.catalogue(scope, context.company().currency()),
                readModel.status(scope),
                readModel.batches(scope),
                new Activity(
                        readModel.operations(scope, todayStart, startOf(scope.today().plusDays(1), scope.zone())),
                        readModel.operations(
                                scope,
                                startOf(period.from(), scope.zone()),
                                startOf(period.to().plusDays(1), scope.zone()))),
                byLocation,
                readModel.attention(scope, ATTENTION_LIMIT));
    }

    public StockFlow flow(Request request) {
        Context context = context(request);
        return new StockFlow(
                Period.of(context.period()), readModel.flow(context.scope(), context.period()));
    }

    public List<RecentOperation> recentActivity(Request request, String type, int limit) {
        String normalized = type == null || type.isBlank() ? null : type.strip().toUpperCase(Locale.ROOT);
        if (normalized != null && !DOCUMENT_TYPES.contains(normalized)) {
            throw new InvalidInputException(
                    "type", "INVALID_FILTER", "Unknown operation type %s.", type);
        }
        return readModel.recentOperations(
                context(request).scope(), normalized, Math.clamp(limit, 1, MAX_RECENT));
    }

    public TopMovements topMovements(Request request, int limit) {
        Context context = context(request);
        CompanyScope scope = context.scope();
        DashboardPeriod period = context.period();
        return new TopMovements(
                Period.of(period),
                readModel.topMoved(
                        scope,
                        startOf(period.from(), scope.zone()),
                        startOf(period.to().plusDays(1), scope.zone()),
                        Math.clamp(limit, 1, MAX_TOP)));
    }

    private record Context(
            CompanySnapshot company, CompanyScope scope, DashboardPeriod period, Set<UUID> allowed) {}

    private Context context(Request request) {
        CurrentUser user = currentUser.require();
        UUID companyId = user.requireCompanyId();
        CompanySnapshot company = companies.find(companyId).orElseThrow();
        ZoneId zone = ZoneId.of(company.timezone());
        LocalDate today = LocalDate.ofInstant(clock.instant(), zone);
        Set<UUID> allowed = user.allLocations() ? null : user.locationIds();
        Set<UUID> locations = allowed;
        if (request.locationId() != null) {
            readModel
                    .location(companyId, request.locationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location", request.locationId()));
            locationAccess.requireAccess(request.locationId());
            locations = Set.of(request.locationId());
        }
        DashboardPeriod period = DashboardPeriod.of(request.period(), request.from(), request.to(), today);
        CompanyScope scope =
                new CompanyScope(
                        companyId,
                        locations,
                        allowed,
                        zone,
                        today,
                        company.expiryWarningDays(),
                        user.has(Permission.STOCK_VALUE_VIEW));
        return new Context(company, scope, period, allowed);
    }

    static Instant startOf(LocalDate day, ZoneId zone) {
        return day.atStartOfDay(zone).toInstant();
    }
}
