package com.stockhub.dashboard.application.dto;

import com.stockhub.dashboard.domain.model.DashboardPeriod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Read models of the dashboards. Financial fields ({@code stockValue}) are null when the user
 * lacks STOCK_VALUE_VIEW: they are not computed at all in that case.
 */
public final class DashboardViews {

    private DashboardViews() {}

    public record Period(
            String code, LocalDate from, LocalDate to, DashboardPeriod.Granularity granularity) {
        public static Period of(DashboardPeriod period) {
            return new Period(period.code(), period.from(), period.to(), period.granularity());
        }
    }

    public record LocationRef(UUID id, String name) {}

    /** Locations the figures cover, and whether the company view spans several of them. */
    public record Scope(
            UUID locationId, List<LocationRef> locations, boolean multiLocation, boolean financial) {}

    public record Catalogue(
            long activeProducts,
            long referencesInStock,
            BigDecimal totalQuantity,
            BigDecimal stockValue,
            String currency) {}

    /** Stock levels (one product in one location) by state; the three first are disjoint. */
    public record StockStatus(long normal, long low, long out, long negative) {}

    public record BatchWatch(long expired, long expiringWithin7Days, long expiringSoon, int warningDays) {}

    /** Operations are stock notes (one per entry, exit…); quantities add units of each line. */
    public record OperationCounts(
            long entries,
            long exits,
            long transfers,
            long adjustments,
            BigDecimal entryQuantity,
            BigDecimal exitQuantity) {
        public long total() {
            return entries + exits + transfers + adjustments;
        }
    }

    public record Activity(OperationCounts today, OperationCounts period) {}

    public record LocationStock(
            UUID locationId,
            String name,
            BigDecimal stockValue,
            long referencesInStock,
            BigDecimal quantity) {}

    public record LevelAlert(
            UUID productId,
            String productName,
            String sku,
            UUID locationId,
            String locationName,
            BigDecimal quantity,
            BigDecimal minStock) {}

    public record BatchAlert(
            UUID batchId,
            UUID productId,
            String productName,
            String batchNumber,
            LocalDate expirationDate,
            BigDecimal quantity,
            UUID locationId,
            String locationName) {}

    public record Attention(
            List<LevelAlert> outOfStock,
            List<LevelAlert> lowStock,
            List<BatchAlert> expiredBatches,
            List<BatchAlert> expiringBatches) {}

    public record Summary(
            Period period,
            Scope scope,
            Catalogue catalogue,
            StockStatus status,
            BatchWatch batches,
            Activity activity,
            List<LocationStock> byLocation,
            Attention attention) {}

    /** One chart bucket: its local start (company time zone) and operations of each direction. */
    public record FlowPoint(
            LocalDateTime bucket,
            long entries,
            long exits,
            BigDecimal entryQuantity,
            BigDecimal exitQuantity) {}

    public record StockFlow(Period period, List<FlowPoint> points) {}

    /**
     * A recent stock note. {@code quantity} is signed (+ entry, - exit, adjustment sign); for a
     * transfer it is the quantity moved.
     */
    public record RecentOperation(
            UUID documentId,
            String type,
            String number,
            Instant createdAt,
            String performedByName,
            LocationRef location,
            LocationRef destination,
            UUID productId,
            String productName,
            String sku,
            long otherProducts,
            BigDecimal quantity) {}

    public record MovedProduct(
            UUID productId,
            String name,
            String sku,
            String unit,
            long operations,
            BigDecimal enteredQuantity,
            BigDecimal exitedQuantity) {}

    public record TopMovements(Period period, List<MovedProduct> products) {}

    // ----- Platform -----

    public record PlatformTotals(
            long companies,
            long activeCompanies,
            long disabledCompanies,
            long users,
            long activeUsers,
            long products,
            long locations,
            long operationsToday) {}

    public record PlatformPoint(LocalDateTime bucket, long newCompanies, long operations) {}

    public record AuditEvent(
            UUID id,
            Instant occurredAt,
            String action,
            String actor,
            UUID companyId,
            String companyName) {}

    public record PlatformDashboard(
            Period period,
            PlatformTotals totals,
            List<PlatformPoint> activity,
            List<AuditEvent> recentEvents) {}
}
