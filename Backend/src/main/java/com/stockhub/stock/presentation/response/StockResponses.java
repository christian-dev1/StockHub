package com.stockhub.stock.presentation.response;

import com.stockhub.stock.domain.model.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/** Explicit REST schemas; SQL bookkeeping columns are not exposed. */
public final class StockResponses {
    private StockResponses() {}

    public record Level(
            UUID id,
            UUID productId,
            UUID locationId,
            String sku,
            String productName,
            BigDecimal quantity,
            BigDecimal minStock,
            boolean lowStock,
            Instant updatedAt) {
        public static Level from(Map<String, Object> r) {
            return new Level(
                    uuid(r, "id"),
                    uuid(r, "productId"),
                    uuid(r, "locationId"),
                    (String) r.get("sku"),
                    (String) r.get("productName"),
                    decimal(r, "quantity"),
                    decimal(r, "minStock"),
                    Boolean.TRUE.equals(r.get("lowStock")),
                    (Instant) r.get("updatedAt"));
        }
    }

    public record BatchView(
            UUID id,
            UUID productId,
            UUID locationId,
            String batchNumber,
            BigDecimal quantity,
            LocalDate manufacturingDate,
            LocalDate expirationDate,
            BatchStatus status,
            ExpiryStatus expiryStatus) {
        public static BatchView from(Map<String, Object> r) {
            return new BatchView(
                    uuid(r, "id"),
                    uuid(r, "productId"),
                    uuid(r, "locationId"),
                    (String) r.get("batchNumber"),
                    decimal(r, "quantity"),
                    (LocalDate) r.get("manufacturingDate"),
                    (LocalDate) r.get("expirationDate"),
                    BatchStatus.valueOf((String) r.get("status")),
                    ExpiryStatus.valueOf((String) r.get("expiryStatus")));
        }
    }

    public record Movement(
            UUID id,
            UUID productId,
            UUID locationId,
            UUID batchId,
            UUID documentId,
            MovementType type,
            BigDecimal quantity,
            BigDecimal previousQuantity,
            BigDecimal newQuantity,
            String reference,
            String reason,
            UUID performedBy,
            Instant createdAt) {
        public static Movement from(Map<String, Object> r) {
            return new Movement(
                    uuid(r, "id"),
                    uuid(r, "productId"),
                    uuid(r, "locationId"),
                    uuid(r, "batchId"),
                    uuid(r, "documentId"),
                    MovementType.valueOf((String) r.get("type")),
                    decimal(r, "quantity"),
                    decimal(r, "previousQuantity"),
                    decimal(r, "newQuantity"),
                    (String) r.get("reference"),
                    (String) r.get("reason"),
                    uuid(r, "performedBy"),
                    (Instant) r.get("createdAt"));
        }
    }

    public record Document(
            UUID id,
            DocumentType type,
            String number,
            UUID locationId,
            UUID destinationLocationId,
            String reference,
            String reason,
            UUID performedBy,
            String performedByName,
            Instant createdAt,
            List<Movement> lines) {
        @SuppressWarnings("unchecked")
        public static Document from(Map<String, Object> r) {
            var lines = (List<Map<String, Object>>) r.getOrDefault("lines", List.of());
            return new Document(
                    uuid(r, "id"),
                    DocumentType.valueOf((String) r.get("type")),
                    (String) r.get("number"),
                    uuid(r, "locationId"),
                    uuid(r, "destinationLocationId"),
                    (String) r.get("reference"),
                    (String) r.get("reason"),
                    uuid(r, "performedBy"),
                    (String) r.get("performedByName"),
                    (Instant) r.get("createdAt"),
                    lines.stream().map(Movement::from).toList());
        }
    }

    private static UUID uuid(Map<String, Object> r, String key) {
        return (UUID) r.get(key);
    }

    private static BigDecimal decimal(Map<String, Object> r, String key) {
        return (BigDecimal) r.get(key);
    }
}
