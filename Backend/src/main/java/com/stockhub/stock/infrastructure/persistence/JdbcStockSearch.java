package com.stockhub.stock.infrastructure.persistence;

import com.stockhub.shared.domain.page.*;
import com.stockhub.stock.application.port.StockSearch;

import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;

import java.time.*;
import java.util.*;

@Repository
class JdbcStockSearch implements StockSearch {
    private final NamedParameterJdbcTemplate jdbc;

    JdbcStockSearch(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PageResult<Map<String, Object>> search(
            String kind,
            UUID company,
            Set<UUID> locations,
            Map<String, String> f,
            PageQuery page,
            LocalDate today,
            int warningDays) {
        String table =
                switch (kind) {
                    case "stocks" -> "stock_levels";
                    case "stock-movements" -> "stock_movements";
                    case "batches" -> "batches";
                    case "stock-documents" -> "stock_documents";
                    default -> throw new IllegalArgumentException();
                };
        var args =
                new MapSqlParameterSource("company", company)
                        .addValue("today", today)
                        .addValue("soon", today.plusDays(warningDays));
        StringBuilder where = new StringBuilder(" WHERE s.company_id=:company");
        if (locations != null) {
            if (locations.isEmpty()) where.append(" AND false");
            else {
                args.addValue("locations", locations);
                where.append(" AND s.location_id IN (:locations)");
                if (kind.equals("stock-documents"))
                    where.append(
                            " AND (s.destination_location_id IS NULL OR s.destination_location_id"
                                    + " IN (:locations))");
            }
        }
        for (String key :
                List.of(
                        "id",
                        "locationId",
                        "productId",
                        "type",
                        "performedBy",
                        "reference",
                        "batchNumber",
                        "documentId")) {
            if (!f.containsKey(key)) continue;
            if ((key.equals("productId") && kind.equals("stock-documents"))
                    || (key.equals("type")
                            && !Set.of("stock-documents", "stock-movements").contains(kind))
                    || (key.equals("performedBy")
                            && !Set.of("stock-documents", "stock-movements").contains(kind))
                    || (key.equals("reference")
                            && !Set.of("stock-documents", "stock-movements").contains(kind))
                    || (key.equals("batchNumber") && !kind.equals("batches"))
                    || (key.equals("documentId") && !kind.equals("stock-movements"))) continue;
            String column = key.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase(Locale.ROOT);
            if (key.equals("reference") && kind.equals("stock-documents")) {
                where.append(" AND (s.reference=:reference OR s.number=:reference)");
                args.addValue(key, f.get(key));
            } else {
                where.append(" AND s.").append(column).append("=:").append(key);
                args.addValue(
                        key,
                        key.equals("id") || key.endsWith("Id") || key.equals("performedBy")
                                ? UUID.fromString(f.get(key))
                                : f.get(key));
            }
        }
        String joins = "";
        String select = "s.*";
        if (kind.equals("stocks")) {
            joins = " JOIN products p ON p.id=s.product_id AND p.company_id=s.company_id";
            select +=
                    ",p.sku,p.name AS product_name,p.min_stock,(s.quantity<=p.min_stock AND"
                            + " p.min_stock>0) AS low_stock";
            if (Boolean.parseBoolean(f.get("lowStock")))
                where.append(" AND s.quantity<=p.min_stock AND p.min_stock>0");
            if (Boolean.parseBoolean(f.get("outOfStock"))) where.append(" AND s.quantity<=0");
            if (f.containsKey("search")) {
                where.append(" AND (p.name ILIKE :search OR p.sku ILIKE :search)");
                args.addValue("search", "%" + f.get("search") + "%");
            }
        }
        String expiry =
                "CASE WHEN s.expiration_date<:today THEN 'EXPIRED' WHEN s.expiration_date<=:soon"
                        + " THEN 'EXPIRING_SOON' ELSE 'VALID' END";
        if (kind.equals("batches")) {
            select += "," + expiry + " AS expiry_status";
            if (f.containsKey("status")) {
                where.append(" AND ").append(expiry).append("=:status");
                args.addValue("status", f.get("status"));
            }
        }
        for (String key : List.of("dateFrom", "dateTo", "expirationFrom", "expirationTo"))
            if (f.containsKey(key)) {
                boolean exp = key.startsWith("expiration");
                if (exp && !kind.equals("batches")) continue;
                where.append(" AND s.")
                        .append(exp ? "expiration_date" : "created_at")
                        .append(key.endsWith("From") ? ">=:" : "<=:")
                        .append(key);
                args.addValue(
                        key,
                        exp
                                ? LocalDate.parse(f.get(key))
                                : java.sql.Timestamp.from(Instant.parse(f.get(key))));
            }
        String from = " FROM " + table + " s" + joins + where;
        long total = jdbc.queryForObject("SELECT count(*)" + from, args, Long.class);
        String sort =
                page.sortField() == null
                        ? "created_at"
                        : page.sortField()
                                .replaceAll("([a-z])([A-Z])", "$1_$2")
                                .toLowerCase(Locale.ROOT);
        Set<String> allowed =
                switch (kind) {
                    case "stocks" -> Set.of("created_at", "updated_at", "quantity");
                    case "batches" ->
                            Set.of("created_at", "expiration_date", "batch_number", "quantity");
                    default -> Set.of("created_at", "reference", "type");
                };
        if (!allowed.contains(sort)) sort = "created_at";
        args.addValue("limit", page.size()).addValue("offset", (long) page.page() * page.size());
        var rows =
                jdbc.queryForList(
                        "SELECT "
                                + select
                                + from
                                + " ORDER BY s."
                                + sort
                                + (page.ascending() ? " ASC" : " DESC")
                                + ",s.id LIMIT :limit OFFSET :offset",
                        args);
        List<Map<String, Object>> result = new ArrayList<>();
        for (var row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            row.forEach(
                    (key, value) -> {
                        StringBuilder camel = new StringBuilder();
                        boolean upper = false;
                        for (char ch : key.toCharArray()) {
                            if (ch == '_') {
                                upper = true;
                                continue;
                            }
                            camel.append(upper ? Character.toUpperCase(ch) : ch);
                            upper = false;
                        }
                        mapped.put(
                                camel.toString(),
                                value instanceof java.sql.Timestamp t
                                        ? t.toInstant()
                                        : value instanceof java.sql.Date d
                                                ? d.toLocalDate()
                                                : value);
                    });
            result.add(mapped);
        }
        return new PageResult<>(result, page.page(), page.size(), total);
    }
}
