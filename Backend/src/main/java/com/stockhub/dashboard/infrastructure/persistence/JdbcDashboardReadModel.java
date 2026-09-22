package com.stockhub.dashboard.infrastructure.persistence;

import com.stockhub.dashboard.application.dto.DashboardViews.*;
import com.stockhub.dashboard.application.port.DashboardReadModel;
import com.stockhub.dashboard.domain.model.DashboardPeriod;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Dashboard aggregations in SQL: every figure is a COUNT, SUM or GROUP BY evaluated by PostgreSQL,
 * never a list loaded and summed in Java. Each method is one query (N+1 free).
 *
 * <p>Definitions (see docs/09-dashboards.md):
 *
 * <ul>
 *   <li>Entries: ENTRY and RETURN_CUSTOMER movements; exits: EXIT, RETURN_SUPPLIER and SALE.
 *       Transfers and adjustments are counted apart.
 *   <li>An operation is a stock note (document): a FEFO exit spread over two batches is one exit.
 *   <li>Stock value: Σ max(quantity, 0) × purchase price, over the levels in scope.
 * </ul>
 */
@Repository
class JdbcDashboardReadModel implements DashboardReadModel {

    private static final String ENTRY_TYPES = "('ENTRY','RETURN_CUSTOMER')";
    private static final String EXIT_TYPES = "('EXIT','RETURN_SUPPLIER','SALE')";
    private static final String INCREASING_TYPES =
            "('ENTRY','TRANSFER_IN','ADJUSTMENT_POSITIVE','RETURN_CUSTOMER')";

    private final NamedParameterJdbcTemplate jdbc;

    JdbcDashboardReadModel(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ----- Locations -----

    @Override
    public Optional<LocationRef> location(UUID companyId, UUID locationId) {
        return jdbc
                .query(
                        "SELECT id, name FROM locations WHERE company_id = :company AND id = :id"
                                + " AND deleted_at IS NULL",
                        Map.of("company", companyId, "id", locationId),
                        (rs, i) -> new LocationRef(uuid(rs, "id"), rs.getString("name")))
                .stream()
                .findFirst();
    }

    @Override
    public List<LocationRef> activeLocations(UUID companyId, Set<UUID> allowed) {
        var args = new MapSqlParameterSource("company", companyId);
        String sql =
                "SELECT id, name FROM locations WHERE company_id = :company AND active"
                        + " AND deleted_at IS NULL"
                        + restrict("id", allowed, "allowed", args)
                        + " ORDER BY is_primary DESC, lower(name)";
        return jdbc.query(sql, args, (rs, i) -> new LocationRef(uuid(rs, "id"), rs.getString("name")));
    }

    // ----- Stock snapshot -----

    @Override
    public Catalogue catalogue(CompanyScope scope, String currency) {
        var args = args(scope);
        String sql =
                "SELECT"
                        + " (SELECT count(*) FROM products p WHERE p.company_id = :company"
                        + "   AND p.active AND p.deleted_at IS NULL) AS active_products,"
                        + " count(DISTINCT l.product_id) FILTER (WHERE l.quantity > 0) AS in_stock_refs,"
                        + " coalesce(sum(l.quantity) FILTER (WHERE l.quantity > 0), 0) AS quantity,"
                        + (scope.financial()
                                ? " coalesce(sum(l.quantity * p.purchase_price) FILTER (WHERE l.quantity > 0), 0)"
                                : " NULL::numeric")
                        + " AS stock_value"
                        + " FROM stock_levels l JOIN products p ON p.id = l.product_id"
                        + " WHERE l.company_id = :company"
                        + restrict("l.location_id", scope.locations(), "locations", args);
        return jdbc.queryForObject(
                sql,
                args,
                (rs, i) ->
                        new Catalogue(
                                rs.getLong("active_products"),
                                rs.getLong("in_stock_refs"),
                                rs.getBigDecimal("quantity"),
                                rs.getBigDecimal("stock_value"),
                                currency));
    }

    @Override
    public StockStatus status(CompanyScope scope) {
        var args = args(scope);
        String sql =
                "SELECT"
                        + " count(*) FILTER (WHERE l.quantity > 0"
                        + "   AND NOT (p.min_stock > 0 AND l.quantity <= p.min_stock)) AS normal,"
                        + " count(*) FILTER (WHERE l.quantity > 0 AND p.min_stock > 0"
                        + "   AND l.quantity <= p.min_stock) AS low,"
                        + " count(*) FILTER (WHERE l.quantity <= 0) AS out_of_stock,"
                        + " count(*) FILTER (WHERE l.quantity < 0) AS negative"
                        + " FROM stock_levels l JOIN products p ON p.id = l.product_id"
                        + " WHERE l.company_id = :company AND p.deleted_at IS NULL"
                        + restrict("l.location_id", scope.locations(), "locations", args);
        return jdbc.queryForObject(
                sql,
                args,
                (rs, i) ->
                        new StockStatus(
                                rs.getLong("normal"),
                                rs.getLong("low"),
                                rs.getLong("out_of_stock"),
                                rs.getLong("negative")));
    }

    @Override
    public BatchWatch batches(CompanyScope scope) {
        var args = args(scope);
        String sql =
                "SELECT"
                        + " count(*) FILTER (WHERE b.expiration_date < :today) AS expired,"
                        + " count(*) FILTER (WHERE b.expiration_date BETWEEN :today AND :week)"
                        + "   AS within_week,"
                        + " count(*) FILTER (WHERE b.expiration_date BETWEEN :today AND :soon)"
                        + "   AS soon"
                        + " FROM batches b"
                        + " WHERE b.company_id = :company AND b.quantity > 0"
                        + restrict("b.location_id", scope.locations(), "locations", args);
        return jdbc.queryForObject(
                sql,
                args,
                (rs, i) ->
                        new BatchWatch(
                                rs.getLong("expired"),
                                rs.getLong("within_week"),
                                rs.getLong("soon"),
                                scope.warningDays()));
    }

    @Override
    public List<LocationStock> byLocation(CompanyScope scope, List<LocationRef> locations) {
        var args = args(scope).addValue("ids", locations.stream().map(LocationRef::id).toList());
        String sql =
                "SELECT loc.id, loc.name,"
                        + (scope.financial()
                                ? " coalesce(sum(l.quantity * p.purchase_price)"
                                        + " FILTER (WHERE l.quantity > 0), 0)"
                                : " NULL::numeric")
                        + " AS stock_value,"
                        + " count(DISTINCT l.product_id) FILTER (WHERE l.quantity > 0) AS in_stock_refs,"
                        + " coalesce(sum(l.quantity) FILTER (WHERE l.quantity > 0), 0) AS quantity"
                        + " FROM locations loc"
                        + " LEFT JOIN stock_levels l ON l.location_id = loc.id"
                        + " LEFT JOIN products p ON p.id = l.product_id"
                        + " WHERE loc.company_id = :company AND loc.id IN (:ids)"
                        + " GROUP BY loc.id, loc.name, loc.is_primary"
                        + " ORDER BY loc.is_primary DESC, lower(loc.name)";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new LocationStock(
                                uuid(rs, "id"),
                                rs.getString("name"),
                                rs.getBigDecimal("stock_value"),
                                rs.getLong("in_stock_refs"),
                                rs.getBigDecimal("quantity")));
    }

    @Override
    public Attention attention(CompanyScope scope, int limit) {
        return new Attention(
                levels(scope, "l.quantity <= 0", "l.updated_at DESC", limit),
                levels(
                        scope,
                        "l.quantity > 0 AND p.min_stock > 0 AND l.quantity <= p.min_stock",
                        "l.quantity / p.min_stock, lower(p.name)",
                        limit),
                batchAlerts(scope, "b.expiration_date < :today", "b.expiration_date", limit),
                batchAlerts(
                        scope,
                        "b.expiration_date BETWEEN :today AND :soon",
                        "b.expiration_date",
                        limit));
    }

    private List<LevelAlert> levels(CompanyScope scope, String condition, String order, int limit) {
        var args = args(scope).addValue("limit", limit);
        String sql =
                "SELECT p.id AS product_id, p.name, p.sku, loc.id AS location_id,"
                        + " loc.name AS location_name, l.quantity, p.min_stock"
                        + " FROM stock_levels l"
                        + " JOIN products p ON p.id = l.product_id"
                        + " JOIN locations loc ON loc.id = l.location_id"
                        + " WHERE l.company_id = :company AND p.deleted_at IS NULL AND "
                        + condition
                        + restrict("l.location_id", scope.locations(), "locations", args)
                        + " ORDER BY "
                        + order
                        + " LIMIT :limit";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new LevelAlert(
                                uuid(rs, "product_id"),
                                rs.getString("name"),
                                rs.getString("sku"),
                                uuid(rs, "location_id"),
                                rs.getString("location_name"),
                                rs.getBigDecimal("quantity"),
                                rs.getBigDecimal("min_stock")));
    }

    private List<BatchAlert> batchAlerts(
            CompanyScope scope, String condition, String order, int limit) {
        var args = args(scope).addValue("limit", limit);
        String sql =
                "SELECT b.id, p.id AS product_id, p.name, b.batch_number, b.expiration_date,"
                        + " b.quantity, loc.id AS location_id, loc.name AS location_name"
                        + " FROM batches b"
                        + " JOIN products p ON p.id = b.product_id"
                        + " JOIN locations loc ON loc.id = b.location_id"
                        + " WHERE b.company_id = :company AND b.quantity > 0 AND "
                        + condition
                        + restrict("b.location_id", scope.locations(), "locations", args)
                        + " ORDER BY "
                        + order
                        + ", lower(b.batch_number) LIMIT :limit";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new BatchAlert(
                                uuid(rs, "id"),
                                uuid(rs, "product_id"),
                                rs.getString("name"),
                                rs.getString("batch_number"),
                                rs.getObject("expiration_date", LocalDate.class),
                                rs.getBigDecimal("quantity"),
                                uuid(rs, "location_id"),
                                rs.getString("location_name")));
    }

    // ----- Activity -----

    @Override
    public OperationCounts operations(CompanyScope scope, Instant from, Instant to) {
        var args = args(scope).addValue("from", ts(from)).addValue("to", ts(to));
        String sql =
                "SELECT"
                        + " count(DISTINCT m.document_id) FILTER (WHERE m.type IN "
                        + ENTRY_TYPES
                        + ") AS entries,"
                        + " count(DISTINCT m.document_id) FILTER (WHERE m.type IN "
                        + EXIT_TYPES
                        + ") AS exits,"
                        + " count(DISTINCT m.document_id) FILTER (WHERE m.type IN"
                        + "   ('TRANSFER_OUT','TRANSFER_IN')) AS transfers,"
                        + " count(DISTINCT m.document_id) FILTER (WHERE m.type IN"
                        + "   ('ADJUSTMENT_POSITIVE','ADJUSTMENT_NEGATIVE')) AS adjustments,"
                        + " coalesce(sum(m.quantity) FILTER (WHERE m.type IN "
                        + ENTRY_TYPES
                        + "), 0) AS entry_quantity,"
                        + " coalesce(sum(m.quantity) FILTER (WHERE m.type IN "
                        + EXIT_TYPES
                        + "), 0) AS exit_quantity"
                        + " FROM stock_movements m"
                        + " WHERE m.company_id = :company"
                        + " AND m.created_at >= :from AND m.created_at < :to"
                        + restrict("m.location_id", scope.locations(), "locations", args);
        return jdbc.queryForObject(
                sql,
                args,
                (rs, i) ->
                        new OperationCounts(
                                rs.getLong("entries"),
                                rs.getLong("exits"),
                                rs.getLong("transfers"),
                                rs.getLong("adjustments"),
                                rs.getBigDecimal("entry_quantity"),
                                rs.getBigDecimal("exit_quantity")));
    }

    @Override
    public List<FlowPoint> flow(CompanyScope scope, DashboardPeriod period) {
        Bucket bucket = Bucket.of(period.granularity());
        var args =
                args(scope)
                        .addValue("zone", scope.zone().getId())
                        .addValue("unit", bucket.unit)
                        .addValue("step", bucket.step)
                        .addValue("firstDay", Date.valueOf(period.from()))
                        .addValue("lastDay", Date.valueOf(period.to()))
                        .addValue("from", ts(period.from().atStartOfDay(scope.zone()).toInstant()))
                        .addValue(
                                "to",
                                ts(period.to().plusDays(1).atStartOfDay(scope.zone()).toInstant()));
        String sql =
                "WITH buckets AS ("
                        + "  SELECT generate_series(date_trunc(:unit, CAST(:firstDay AS timestamp)),"
                        + "    CAST(:lastDay AS timestamp) + interval '1 day' - interval '1 second',"
                        + "    CAST(:step AS interval)) AS bucket"
                        + "), moves AS ("
                        + "  SELECT date_trunc(:unit, m.created_at AT TIME ZONE :zone) AS bucket,"
                        + "    m.type, m.document_id, m.quantity"
                        + "  FROM stock_movements m"
                        + "  WHERE m.company_id = :company"
                        + "  AND m.created_at >= :from AND m.created_at < :to"
                        + "  AND m.type IN ('ENTRY','RETURN_CUSTOMER','EXIT','RETURN_SUPPLIER','SALE')"
                        + restrict("m.location_id", scope.locations(), "locations", args)
                        + ")"
                        + " SELECT b.bucket,"
                        + " count(DISTINCT mv.document_id) FILTER (WHERE mv.type IN "
                        + ENTRY_TYPES
                        + ") AS entries,"
                        + " count(DISTINCT mv.document_id) FILTER (WHERE mv.type IN "
                        + EXIT_TYPES
                        + ") AS exits,"
                        + " coalesce(sum(mv.quantity) FILTER (WHERE mv.type IN "
                        + ENTRY_TYPES
                        + "), 0) AS entry_quantity,"
                        + " coalesce(sum(mv.quantity) FILTER (WHERE mv.type IN "
                        + EXIT_TYPES
                        + "), 0) AS exit_quantity"
                        + " FROM buckets b LEFT JOIN moves mv ON mv.bucket = b.bucket"
                        + " GROUP BY b.bucket ORDER BY b.bucket";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new FlowPoint(
                                rs.getTimestamp("bucket").toLocalDateTime(),
                                rs.getLong("entries"),
                                rs.getLong("exits"),
                                rs.getBigDecimal("entry_quantity"),
                                rs.getBigDecimal("exit_quantity")));
    }

    @Override
    public List<RecentOperation> recentOperations(CompanyScope scope, String type, int limit) {
        var args = args(scope).addValue("limit", limit).addValue("type", type);
        StringBuilder where = new StringBuilder(" WHERE d.company_id = :company");
        if (type != null) where.append(" AND d.type = :type");
        // Same visibility as the stock notes list: both sides of a transfer must be visible.
        if (scope.allowed() != null) {
            args.addValue("allowed", nonEmpty(scope.allowed()));
            where.append(" AND d.location_id IN (:allowed)")
                    .append(
                            " AND (d.destination_location_id IS NULL"
                                    + " OR d.destination_location_id IN (:allowed))");
        }
        if (scope.locations() != null) {
            args.addValue("locations", nonEmpty(scope.locations()));
            where.append(
                    " AND (d.location_id IN (:locations)"
                            + " OR d.destination_location_id IN (:locations))");
        }
        String sql =
                "SELECT d.id, d.type, d.number, d.created_at, d.performed_by_name,"
                        + " src.id AS src_id, src.name AS src_name,"
                        + " dst.id AS dst_id, dst.name AS dst_name,"
                        + " agg.product_id, agg.product_name, agg.sku, agg.products, agg.quantity"
                        + " FROM stock_documents d"
                        + " JOIN locations src ON src.id = d.location_id"
                        + " LEFT JOIN locations dst ON dst.id = d.destination_location_id"
                        + " CROSS JOIN LATERAL ("
                        + "   SELECT count(DISTINCT m.product_id) AS products,"
                        + "     (array_agg(p.id ORDER BY lower(p.name), p.id))[1] AS product_id,"
                        + "     (array_agg(p.name ORDER BY lower(p.name), p.id))[1] AS product_name,"
                        + "     (array_agg(p.sku ORDER BY lower(p.name), p.id))[1] AS sku,"
                        + "     sum(CASE WHEN m.type = 'TRANSFER_OUT' THEN m.quantity"
                        + "       WHEN m.type IN "
                        + INCREASING_TYPES
                        + " THEN m.quantity ELSE -m.quantity END)"
                        + "       FILTER (WHERE m.type <> 'TRANSFER_IN') AS quantity"
                        + "   FROM stock_movements m JOIN products p ON p.id = m.product_id"
                        + "   WHERE m.document_id = d.id"
                        + " ) agg"
                        + where
                        + " ORDER BY d.created_at DESC, d.number DESC LIMIT :limit";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new RecentOperation(
                                uuid(rs, "id"),
                                rs.getString("type"),
                                rs.getString("number"),
                                instant(rs, "created_at"),
                                rs.getString("performed_by_name"),
                                new LocationRef(uuid(rs, "src_id"), rs.getString("src_name")),
                                rs.getObject("dst_id") == null
                                        ? null
                                        : new LocationRef(uuid(rs, "dst_id"), rs.getString("dst_name")),
                                uuid(rs, "product_id"),
                                rs.getString("product_name"),
                                rs.getString("sku"),
                                Math.max(0, rs.getLong("products") - 1),
                                rs.getBigDecimal("quantity")));
    }

    @Override
    public List<MovedProduct> topMoved(CompanyScope scope, Instant from, Instant to, int limit) {
        var args =
                args(scope)
                        .addValue("from", ts(from))
                        .addValue("to", ts(to))
                        .addValue("limit", limit);
        String sql =
                "SELECT p.id, p.name, p.sku, p.unit,"
                        + " count(DISTINCT m.document_id) AS operations,"
                        + " coalesce(sum(m.quantity) FILTER (WHERE m.type IN "
                        + ENTRY_TYPES
                        + "), 0) AS entered,"
                        + " coalesce(sum(m.quantity) FILTER (WHERE m.type IN "
                        + EXIT_TYPES
                        + "), 0) AS exited"
                        + " FROM stock_movements m JOIN products p ON p.id = m.product_id"
                        + " WHERE m.company_id = :company"
                        + " AND m.created_at >= :from AND m.created_at < :to"
                        + restrict("m.location_id", scope.locations(), "locations", args)
                        + " GROUP BY p.id, p.name, p.sku, p.unit"
                        + " ORDER BY operations DESC, sum(m.quantity) DESC, lower(p.name)"
                        + " LIMIT :limit";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new MovedProduct(
                                uuid(rs, "id"),
                                rs.getString("name"),
                                rs.getString("sku"),
                                rs.getString("unit"),
                                rs.getLong("operations"),
                                rs.getBigDecimal("entered"),
                                rs.getBigDecimal("exited")));
    }

    // ----- Platform -----

    @Override
    public PlatformTotals platformTotals(Instant todayStart, Instant tomorrowStart) {
        var args =
                new MapSqlParameterSource("from", ts(todayStart)).addValue("to", ts(tomorrowStart));
        String sql =
                "SELECT"
                        + " (SELECT count(*) FROM companies) AS companies,"
                        + " (SELECT count(*) FROM companies WHERE status = 'ACTIVE') AS active_companies,"
                        + " (SELECT count(*) FROM users WHERE company_id IS NOT NULL"
                        + "   AND deleted_at IS NULL) AS users,"
                        + " (SELECT count(*) FROM users WHERE company_id IS NOT NULL"
                        + "   AND deleted_at IS NULL AND status = 'ACTIVE') AS active_users,"
                        + " (SELECT count(*) FROM products WHERE deleted_at IS NULL) AS products,"
                        + " (SELECT count(*) FROM locations WHERE deleted_at IS NULL AND active)"
                        + "   AS locations,"
                        + " (SELECT count(*) FROM stock_documents"
                        + "   WHERE created_at >= :from AND created_at < :to) AS operations_today";
        return jdbc.queryForObject(
                sql,
                args,
                (rs, i) ->
                        new PlatformTotals(
                                rs.getLong("companies"),
                                rs.getLong("active_companies"),
                                rs.getLong("companies") - rs.getLong("active_companies"),
                                rs.getLong("users"),
                                rs.getLong("active_users"),
                                rs.getLong("products"),
                                rs.getLong("locations"),
                                rs.getLong("operations_today")));
    }

    @Override
    public List<PlatformPoint> platformActivity(DashboardPeriod period) {
        Bucket bucket = Bucket.of(period.granularity());
        var args =
                new MapSqlParameterSource("unit", bucket.unit)
                        .addValue("step", bucket.step)
                        .addValue("firstDay", Date.valueOf(period.from()))
                        .addValue("lastDay", Date.valueOf(period.to()))
                        .addValue("from", ts(period.from().atStartOfDay(ZoneOffset.UTC).toInstant()))
                        .addValue(
                                "to",
                                ts(period.to().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));
        String sql =
                "WITH buckets AS ("
                        + "  SELECT generate_series(date_trunc(:unit, CAST(:firstDay AS timestamp)),"
                        + "    CAST(:lastDay AS timestamp) + interval '1 day' - interval '1 second',"
                        + "    CAST(:step AS interval)) AS bucket"
                        + ")"
                        + " SELECT b.bucket,"
                        + " (SELECT count(*) FROM companies c"
                        + "   WHERE c.created_at >= :from AND c.created_at < :to"
                        + "   AND date_trunc(:unit, c.created_at AT TIME ZONE 'UTC') = b.bucket)"
                        + "   AS new_companies,"
                        + " (SELECT count(*) FROM stock_documents d"
                        + "   WHERE d.created_at >= :from AND d.created_at < :to"
                        + "   AND date_trunc(:unit, d.created_at AT TIME ZONE 'UTC') = b.bucket)"
                        + "   AS operations"
                        + " FROM buckets b ORDER BY b.bucket";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new PlatformPoint(
                                rs.getTimestamp("bucket").toLocalDateTime(),
                                rs.getLong("new_companies"),
                                rs.getLong("operations")));
    }

    @Override
    public List<AuditEvent> recentAuditEvents(Set<String> actions, int limit) {
        var args = new MapSqlParameterSource("actions", actions).addValue("limit", limit);
        String sql =
                "SELECT a.id, a.occurred_at, a.action, c.id AS company_id, c.name AS company_name,"
                        + " coalesce(nullif(trim(u.first_name || ' ' || u.last_name), ''),"
                        + "   a.actor_email) AS actor"
                        + " FROM audit_logs a"
                        + " LEFT JOIN companies c ON c.id = a.company_id"
                        + " LEFT JOIN users u ON u.id = a.user_id"
                        + " WHERE a.action IN (:actions)"
                        + " ORDER BY a.occurred_at DESC, a.id LIMIT :limit";
        return jdbc.query(
                sql,
                args,
                (rs, i) ->
                        new AuditEvent(
                                uuid(rs, "id"),
                                instant(rs, "occurred_at"),
                                rs.getString("action"),
                                rs.getString("actor"),
                                (UUID) rs.getObject("company_id"),
                                rs.getString("company_name")));
    }

    // ----- Helpers -----

    /** date_trunc unit and generate_series step of each granularity. */
    private record Bucket(String unit, String step) {
        static Bucket of(DashboardPeriod.Granularity granularity) {
            String unit = granularity.name().toLowerCase(Locale.ROOT);
            return new Bucket(unit, "1 " + unit);
        }
    }

    private static MapSqlParameterSource args(CompanyScope scope) {
        return new MapSqlParameterSource("company", scope.companyId())
                .addValue("today", Date.valueOf(scope.today()))
                .addValue("week", Date.valueOf(scope.today().plusDays(7)))
                .addValue("soon", Date.valueOf(scope.today().plusDays(scope.warningDays())));
    }

    /** "AND column IN (:name)" for a restricted scope; nothing when every location is visible. */
    private static String restrict(
            String column, Set<UUID> ids, String name, MapSqlParameterSource args) {
        if (ids == null) return "";
        args.addValue(name, nonEmpty(ids));
        return " AND " + column + " IN (:" + name + ")";
    }

    /** An empty IN list is invalid SQL: a random id matches nothing. */
    private static Set<UUID> nonEmpty(Set<UUID> ids) {
        return ids.isEmpty() ? Set.of(new UUID(0, 0)) : ids;
    }

    private static Timestamp ts(Instant instant) {
        return Timestamp.from(instant);
    }

    private static UUID uuid(ResultSet rs, String column) throws SQLException {
        return (UUID) rs.getObject(column);
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getTimestamp(column).toInstant();
    }
}
