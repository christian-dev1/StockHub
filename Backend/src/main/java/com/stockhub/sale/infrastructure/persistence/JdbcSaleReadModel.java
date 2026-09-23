package com.stockhub.sale.infrastructure.persistence;

import com.stockhub.sale.application.dto.SaleListItem;
import com.stockhub.sale.application.dto.SaleView;
import com.stockhub.sale.application.dto.SellableProduct;
import com.stockhub.sale.application.dto.SellerSummaryView;
import com.stockhub.sale.application.port.SaleReadModel;
import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.SaleStatus;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * SQL read side of sales. The catalogue part reads products, categories, stock levels and batches
 * directly: availability of a batch-tracked product only counts non-expired batches, like FEFO.
 */
@Repository
class JdbcSaleReadModel implements SaleReadModel {
    private static final Map<String, String> SALE_SORTS =
            Map.of("createdAt", "s.created_at", "number", "s.number", "totalAmount", "s.total_amount");

    private static final String SALE_COLUMNS =
            """
            s.id, s.number, s.status, s.location_id, l.name AS location_name, s.seller_id, s.seller_name,
            s.customer_name, s.payment_method, s.currency, s.total_amount, s.created_at
            """;

    private static final String CATALOGUE =
            """
            WITH catalogue AS (
                SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, c.name AS category_name,
                       p.unit, p.sale_price, p.batch_tracked,
                       EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id) AS has_image,
                       CASE WHEN p.batch_tracked THEN
                                COALESCE((SELECT SUM(b.quantity) FROM batches b
                                          WHERE b.company_id = p.company_id AND b.location_id = :location
                                            AND b.product_id = p.id AND b.status = 'ACTIVE'
                                            AND (b.expiration_date IS NULL OR b.expiration_date >= :today)), 0)
                            ELSE
                                COALESCE((SELECT sl.quantity FROM stock_levels sl
                                          WHERE sl.company_id = p.company_id AND sl.location_id = :location
                                            AND sl.product_id = p.id), 0)
                       END AS available_quantity,
                       COALESCE(p.barcode = CAST(:code AS VARCHAR)
                                OR lower(p.sku) = lower(CAST(:code AS VARCHAR)), FALSE) AS exact_match
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE p.company_id = :company AND p.deleted_at IS NULL AND p.active
                %s
            )
            """;

    private final NamedParameterJdbcTemplate jdbc;

    JdbcSaleReadModel(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public PageResult<SaleListItem> search(Scope scope, Criteria criteria, PageQuery page) {
        if (scope.locationIds() != null && scope.locationIds().isEmpty()) {
            return new PageResult<>(List.of(), page.page(), page.size(), 0);
        }
        var args = new MapSqlParameterSource("company", scope.companyId());
        StringBuilder where = new StringBuilder(" WHERE s.company_id = :company");
        if (scope.sellerId() != null) {
            where.append(" AND s.seller_id = :seller");
            args.addValue("seller", scope.sellerId());
        }
        if (scope.locationIds() != null) {
            where.append(" AND s.location_id IN (:locations)");
            args.addValue("locations", scope.locationIds());
        }
        if (criteria.search() != null) {
            where.append(" AND (s.number ILIKE :search OR s.customer_name ILIKE :search)");
            args.addValue("search", "%" + escapeLike(criteria.search()) + "%");
        }
        if (criteria.from() != null) {
            where.append(" AND s.created_at >= :from");
            args.addValue("from", Timestamp.from(criteria.from()));
        }
        if (criteria.to() != null) {
            where.append(" AND s.created_at < :to");
            args.addValue("to", Timestamp.from(criteria.to()));
        }
        if (criteria.paymentMethod() != null) {
            where.append(" AND s.payment_method = :payment");
            args.addValue("payment", criteria.paymentMethod().name());
        }
        if (criteria.status() != null) {
            where.append(" AND s.status = :status");
            args.addValue("status", criteria.status().name());
        }
        Long total = jdbc.queryForObject("SELECT count(*) FROM sales s" + where, args, Long.class);
        String order =
                SALE_SORTS.getOrDefault(page.sortField(), "s.created_at")
                        + (page.ascending() ? " ASC" : " DESC");
        args.addValue("limit", page.size()).addValue("offset", (long) page.page() * page.size());
        List<SaleListItem> rows =
                jdbc.query(
                        "SELECT "
                                + SALE_COLUMNS
                                + ", (SELECT count(*) FROM sale_lines x WHERE x.sale_id = s.id) AS item_count"
                                + " FROM sales s JOIN locations l ON l.id = s.location_id"
                                + where
                                + " ORDER BY "
                                + order
                                + ", s.id LIMIT :limit OFFSET :offset",
                        args,
                        (rs, n) -> listItem(rs));
        return new PageResult<>(rows, page.page(), page.size(), total == null ? 0 : total);
    }

    @Override
    public Optional<SaleView> find(UUID companyId, UUID saleId) {
        var args = new MapSqlParameterSource("company", companyId).addValue("id", saleId);
        List<SaleView.Line> lines =
                jdbc.query(
                        """
                        SELECT x.position, x.product_id, x.product_name, x.sku, x.unit, x.quantity, x.unit_price,
                               x.line_total
                        FROM sale_lines x JOIN sales s ON s.id = x.sale_id
                        WHERE s.company_id = :company AND s.id = :id
                        ORDER BY x.position
                        """,
                        args,
                        (rs, n) ->
                                new SaleView.Line(
                                        rs.getInt("position"),
                                        rs.getObject("product_id", UUID.class),
                                        rs.getString("product_name"),
                                        rs.getString("sku"),
                                        rs.getString("unit"),
                                        rs.getBigDecimal("quantity"),
                                        rs.getBigDecimal("unit_price"),
                                        rs.getBigDecimal("line_total")));
        return jdbc.query(
                        "SELECT "
                                + SALE_COLUMNS
                                + ", d.number AS document_number"
                                + " FROM sales s JOIN locations l ON l.id = s.location_id"
                                + " JOIN stock_documents d ON d.id = s.stock_document_id"
                                + " WHERE s.company_id = :company AND s.id = :id",
                        args,
                        (rs, n) ->
                                new SaleView(
                                        rs.getObject("id", UUID.class),
                                        rs.getString("number"),
                                        SaleStatus.valueOf(rs.getString("status")),
                                        rs.getObject("location_id", UUID.class),
                                        rs.getString("location_name"),
                                        rs.getObject("seller_id", UUID.class),
                                        rs.getString("seller_name"),
                                        rs.getString("customer_name"),
                                        PaymentMethod.valueOf(rs.getString("payment_method")),
                                        rs.getString("currency"),
                                        rs.getBigDecimal("total_amount"),
                                        rs.getString("document_number"),
                                        instant(rs, "created_at"),
                                        lines))
                .stream()
                .findFirst();
    }

    @Override
    public SellerSummaryView.Totals totals(UUID companyId, UUID sellerId, Instant from, Instant to) {
        return jdbc.queryForObject(
                """
                SELECT count(*) AS sales_count, COALESCE(SUM(total_amount), 0) AS revenue
                FROM sales
                WHERE company_id = :company AND seller_id = :seller AND created_at >= :from AND created_at < :to
                """,
                sellerRange(companyId, sellerId, from, to),
                (rs, n) ->
                        new SellerSummaryView.Totals(
                                rs.getLong("sales_count"), rs.getBigDecimal("revenue"), null));
    }

    @Override
    public List<SellerSummaryView.TopProduct> topProducts(
            UUID companyId, UUID sellerId, Instant from, Instant to, int limit) {
        return jdbc.query(
                """
                SELECT x.product_id, MAX(x.product_name) AS product_name, MAX(x.sku) AS sku,
                       SUM(x.quantity) AS quantity, SUM(x.line_total) AS revenue
                FROM sale_lines x JOIN sales s ON s.id = x.sale_id
                WHERE s.company_id = :company AND s.seller_id = :seller
                  AND s.created_at >= :from AND s.created_at < :to
                GROUP BY x.product_id
                ORDER BY quantity DESC, revenue DESC, product_name
                LIMIT :limit
                """,
                sellerRange(companyId, sellerId, from, to).addValue("limit", limit),
                (rs, n) ->
                        new SellerSummaryView.TopProduct(
                                rs.getObject("product_id", UUID.class),
                                rs.getString("product_name"),
                                rs.getString("sku"),
                                rs.getBigDecimal("quantity"),
                                rs.getBigDecimal("revenue")));
    }

    @Override
    public PageResult<SellableProduct> catalogue(
            UUID companyId,
            UUID locationId,
            LocalDate today,
            String search,
            UUID categoryId,
            boolean inStockOnly,
            PageQuery page) {
        var args = catalogueArgs(companyId, locationId, today).addValue("code", search);
        StringBuilder filters = new StringBuilder();
        if (search != null) {
            filters.append(
                    " AND (lower(p.name) LIKE :search OR lower(p.sku) LIKE :search OR p.barcode = :code)");
            args.addValue("search", "%" + escapeLike(search.toLowerCase(java.util.Locale.ROOT)) + "%");
        }
        if (categoryId != null) {
            filters.append(
                    " AND (p.category_id = :category OR p.category_id IN"
                            + " (SELECT k.id FROM categories k WHERE k.company_id = :company AND k.parent_id = :category))");
            args.addValue("category", categoryId);
        }
        String cte = CATALOGUE.formatted(filters);
        String visible = inStockOnly ? " WHERE available_quantity > 0" : "";
        Long total = jdbc.queryForObject(cte + "SELECT count(*) FROM catalogue" + visible, args, Long.class);
        args.addValue("limit", page.size()).addValue("offset", (long) page.page() * page.size());
        List<SellableProduct> rows =
                jdbc.query(
                        cte
                                + "SELECT * FROM catalogue"
                                + visible
                                + " ORDER BY exact_match DESC, lower(name), id LIMIT :limit OFFSET :offset",
                        args,
                        (rs, n) -> sellable(rs));
        return new PageResult<>(rows, page.page(), page.size(), total == null ? 0 : total);
    }

    @Override
    public Optional<SellableProduct> sellable(
            UUID companyId, UUID locationId, LocalDate today, UUID productId) {
        var args =
                catalogueArgs(companyId, locationId, today)
                        .addValue("code", null)
                        .addValue("product", productId);
        return jdbc.query(
                        CATALOGUE.formatted(" AND p.id = :product") + "SELECT * FROM catalogue",
                        args,
                        (rs, n) -> sellable(rs))
                .stream()
                .findFirst();
    }

    private static MapSqlParameterSource catalogueArgs(UUID companyId, UUID locationId, LocalDate today) {
        return new MapSqlParameterSource("company", companyId)
                .addValue("location", locationId)
                .addValue("today", Date.valueOf(today));
    }

    private static MapSqlParameterSource sellerRange(UUID companyId, UUID sellerId, Instant from, Instant to) {
        return new MapSqlParameterSource("company", companyId)
                .addValue("seller", sellerId)
                .addValue("from", Timestamp.from(from))
                .addValue("to", Timestamp.from(to));
    }

    private static SellableProduct sellable(ResultSet rs) throws SQLException {
        return new SellableProduct(
                rs.getObject("id", UUID.class),
                rs.getString("sku"),
                rs.getString("barcode"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getObject("category_id", UUID.class),
                rs.getString("category_name"),
                rs.getString("unit"),
                rs.getBigDecimal("sale_price"),
                rs.getBoolean("batch_tracked"),
                rs.getBoolean("has_image"),
                rs.getBigDecimal("available_quantity"));
    }

    private static SaleListItem listItem(ResultSet rs) throws SQLException {
        return new SaleListItem(
                rs.getObject("id", UUID.class),
                rs.getString("number"),
                SaleStatus.valueOf(rs.getString("status")),
                rs.getObject("location_id", UUID.class),
                rs.getString("location_name"),
                rs.getString("seller_name"),
                rs.getString("customer_name"),
                PaymentMethod.valueOf(rs.getString("payment_method")),
                rs.getString("currency"),
                rs.getBigDecimal("total_amount"),
                rs.getInt("item_count"),
                instant(rs, "created_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getTimestamp(column).toInstant();
    }

    /** User text is matched literally: LIKE wildcards typed by the user are escaped. */
    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
