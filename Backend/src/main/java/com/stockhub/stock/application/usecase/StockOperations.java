package com.stockhub.stock.application.usecase;

import com.stockhub.audit.*;
import com.stockhub.product.ProductSummary;
import com.stockhub.shared.application.SequenceGenerator;
import com.stockhub.shared.domain.exception.*;
import com.stockhub.stock.application.command.StockCommands.*;
import com.stockhub.stock.domain.exception.StockErrors;
import com.stockhub.stock.domain.model.*;
import com.stockhub.stock.domain.repository.*;
import com.stockhub.stock.domain.service.BatchAllocator;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class StockOperations {
    private final StockContext context;
    private final StockLevelRepository levels;
    private final BatchRepository batches;
    private final StockMovementRepository ledger;
    private final SequenceGenerator sequences;
    private final AuditRecorder audit;

    public StockOperations(
            StockContext context,
            StockLevelRepository levels,
            BatchRepository batches,
            StockMovementRepository ledger,
            SequenceGenerator sequences,
            AuditRecorder audit) {
        this.context = context;
        this.levels = levels;
        this.batches = batches;
        this.ledger = ledger;
        this.sequences = sequences;
        this.audit = audit;
    }

    private void require(boolean valid, String code) {
        if (!valid) throw new BusinessRuleViolationException(code, code);
    }

    private void lines(List<?> lines) {
        require(
                lines != null
                        && !lines.isEmpty()
                        && lines.size() <= 100
                        && lines.stream().noneMatch(Objects::isNull),
                "INVALID_LINES");
    }

    private StockDocument document(
            StockContext.Operation o,
            DocumentType type,
            UUID location,
            UUID destination,
            String reason,
            String reference) {
        int year = o.today().getYear();
        String number =
                SequenceGenerator.documentNumber(
                        type.prefix(), year, sequences.next(o.companyId(), type.sequence(), year));
        var d =
                StockDocument.create(
                        o.companyId(),
                        type,
                        number,
                        location,
                        destination,
                        reason,
                        reference,
                        o.userId(),
                        o.userName(),
                        o.now());
        ledger.add(d);
        return d;
    }

    private ProductSummary product(StockContext.Operation o, UUID id) {
        var p = context.product(o.companyId(), id, "productId");
        require(!p.expiryTracked() || p.batchTracked(), "BATCH_REQUIRED");
        return p;
    }

    private void move(
            StockContext.Operation o,
            StockDocument d,
            StockLevel level,
            Batch batch,
            MovementType type,
            BigDecimal q,
            ProductSummary p,
            List<StockMovement> ms) {
        var change = level.apply(type, q, o.allowNegativeStock(), p.sku());
        if (batch != null) {
            if (type.increases()) batch.add(q);
            else batch.remove(q, p.sku());
            batches.save(batch);
        }
        levels.save(level);
        ms.add(StockMovement.record(d, level, batch == null ? null : batch.id(), type, q, change));
    }

    private Batch incoming(
            StockContext.Operation o,
            UUID location,
            ProductSummary p,
            String number,
            java.time.LocalDate manufacturing,
            java.time.LocalDate expiration) {
        require(number != null && !number.isBlank(), "BATCH_REQUIRED");
        require(!p.expiryTracked() || expiration != null, "BATCH_EXPIRATION_REQUIRED");
        var b =
                batches.lockByNumber(o.companyId(), location, p.id(), Batch.normalizeNumber(number))
                        .orElseGet(
                                () ->
                                        Batch.open(
                                                o.companyId(),
                                                location,
                                                p.id(),
                                                number,
                                                manufacturing,
                                                expiration));
        require(b.sameDates(manufacturing, expiration), "BATCH_DATES_MISMATCH");
        return b;
    }

    private List<BatchAllocator.Allocation> outgoing(
            StockContext.Operation o, UUID location, ProductSummary p, OutLine line) {
        if (!p.batchTracked()) {
            require(line.batchId() == null, "BATCH_NOT_ALLOWED");
            return List.of();
        }
        if (line.batchId() == null)
            return BatchAllocator.allocate(
                    batches.lockAvailable(o.companyId(), location, p.id()),
                    line.quantity(),
                    o.today(),
                    p.sku());
        var b =
                batches.lockById(o.companyId(), line.batchId())
                        .filter(
                                x ->
                                        x.locationId().equals(location)
                                                && x.productId().equals(p.id()))
                        .orElseThrow(() -> StockErrors.batchNotFound(line.batchId()));
        if (b.isExpired(o.today())) throw StockErrors.batchExpired(b.batchNumber());
        require(b.quantity().compareTo(line.quantity()) >= 0, "INSUFFICIENT_STOCK");
        return List.of(new BatchAllocator.Allocation(b, line.quantity()));
    }

    private StockDocument finish(StockDocument d, List<StockMovement> ms) {
        ledger.append(ms);
        audit.record(
                AuditEntry.of("STOCK_" + d.type().name(), "StockDocument", d.id())
                        .inCompany(d.companyId())
                        .change(null, ms)
                        .withMetadata(
                                d.destinationLocationId() == null
                                        ? Map.of("reference", d.number())
                                        : Map.of(
                                                "reference",
                                                d.number(),
                                                "sourceLocation",
                                                d.locationId(),
                                                "destinationLocation",
                                                d.destinationLocationId())));
        return d;
    }

    // Deterministic lock order also covers opposite transfers and multi-product documents.
    private Map<String, StockLevel> lock(
            StockContext.Operation o, List<UUID> locations, List<UUID> products) {
        Map<String, StockLevel> result = new HashMap<>();
        for (UUID l : locations.stream().distinct().sorted().toList())
            for (UUID p : products.stream().distinct().sorted().toList())
                result.put(l + ":" + p, levels.lock(o.companyId(), l, p));
        return result;
    }

    public StockDocument entry(Entry c) {
        var o = context.begin();
        context.requireOperableLocation(o.companyId(), c.locationId(), "locationId");
        lines(c.lines());
        MovementType type = c.type() == null ? MovementType.ENTRY : c.type();
        require(
                type == MovementType.ENTRY || type == MovementType.RETURN_CUSTOMER,
                "INVALID_MOVEMENT_TYPE");
        c.lines().forEach(l -> product(o, l.productId()));
        var locked =
                lock(
                        o,
                        List.of(c.locationId()),
                        c.lines().stream().map(EntryLine::productId).toList());
        var d = document(o, DocumentType.ENTRY, c.locationId(), null, c.reason(), c.reference());
        List<StockMovement> ms = new ArrayList<>();
        for (var line : c.lines()) {
            var p = product(o, line.productId());
            var q = Quantities.requirePositive(line.quantity(), p.unit(), "quantity");
            var b =
                    p.batchTracked()
                            ? incoming(
                                    o,
                                    c.locationId(),
                                    p,
                                    line.batchNumber(),
                                    line.manufacturingDate(),
                                    line.expirationDate())
                            : null;
            move(o, d, locked.get(c.locationId() + ":" + p.id()), b, type, q, p, ms);
        }
        return finish(d, ms);
    }

    public StockDocument exit(Exit c) {
        MovementType type = c.type() == null ? MovementType.EXIT : c.type();
        require(
                type == MovementType.EXIT || type == MovementType.RETURN_SUPPLIER,
                "INVALID_MOVEMENT_TYPE");
        return issue(c, type);
    }

    /**
     * Goods sold at a point of sale: a goods-issued note whose movements are SALE (FEFO, expired
     * batches excluded, no negative stock unless the company allows it). Only reachable through
     * the sales module, never through the stock API.
     */
    public StockDocument sale(UUID locationId, String saleNumber, List<OutLine> lines) {
        return issue(new Exit(locationId, MovementType.SALE, null, saleNumber, lines), MovementType.SALE);
    }

    private StockDocument issue(Exit c, MovementType type) {
        var o = context.begin();
        context.requireOperableLocation(o.companyId(), c.locationId(), "locationId");
        lines(c.lines());
        c.lines().forEach(l -> product(o, l.productId()));
        var locked =
                lock(
                        o,
                        List.of(c.locationId()),
                        c.lines().stream().map(OutLine::productId).toList());
        var d = document(o, DocumentType.EXIT, c.locationId(), null, c.reason(), c.reference());
        List<StockMovement> ms = new ArrayList<>();
        for (var line : c.lines()) {
            var p = product(o, line.productId());
            var q = Quantities.requirePositive(line.quantity(), p.unit(), "quantity");
            var level = locked.get(c.locationId() + ":" + p.id());
            var allocations = outgoing(o, c.locationId(), p, line);
            if (!p.batchTracked()) move(o, d, level, null, type, q, p, ms);
            else for (var a : allocations) move(o, d, level, a.batch(), type, a.quantity(), p, ms);
        }
        return finish(d, ms);
    }

    public StockDocument adjustment(Adjustment c) {
        var o = context.begin();
        context.requireOperableLocation(o.companyId(), c.locationId(), "locationId");
        var p = product(o, c.productId());
        require(c.reason() != null && !c.reason().isBlank(), "REASON_REQUIRED");
        var q = c.countedQuantity();
        require(q != null, "QUANTITY_INVALID");
        if (q.signum() != 0) Quantities.requirePositive(q.abs(), p.unit(), "countedQuantity");
        require(q.signum() >= 0 || o.allowNegativeStock(), "INSUFFICIENT_STOCK");
        var level = levels.lock(o.companyId(), c.locationId(), p.id());
        Batch b = null;
        if (p.batchTracked()) {
            require(c.batchId() != null, "BATCH_REQUIRED");
            b =
                    batches.lockById(o.companyId(), c.batchId())
                            .filter(
                                    x ->
                                            x.locationId().equals(c.locationId())
                                                    && x.productId().equals(p.id()))
                            .orElseThrow(() -> StockErrors.batchNotFound(c.batchId()));
            require(q.signum() >= 0, "INSUFFICIENT_STOCK");
        } else require(c.batchId() == null, "BATCH_NOT_ALLOWED");
        BigDecimal delta = q.subtract(b == null ? level.quantity() : b.quantity());
        require(delta.signum() != 0, "STOCK_UNCHANGED");
        var d = document(o, DocumentType.ADJUSTMENT, c.locationId(), null, c.reason(), null);
        List<StockMovement> ms = new ArrayList<>();
        move(
                o,
                d,
                level,
                b,
                delta.signum() > 0
                        ? MovementType.ADJUSTMENT_POSITIVE
                        : MovementType.ADJUSTMENT_NEGATIVE,
                delta.abs(),
                p,
                ms);
        return finish(d, ms);
    }

    public StockDocument transfer(Transfer c) {
        var o = context.begin();
        require(
                c.sourceLocationId() != null
                        && !c.sourceLocationId().equals(c.destinationLocationId()),
                "INVALID_TRANSFER");
        context.requireOperableLocation(o.companyId(), c.sourceLocationId(), "sourceLocationId");
        context.requireOperableLocation(
                o.companyId(), c.destinationLocationId(), "destinationLocationId");
        lines(c.lines());
        c.lines().forEach(l -> product(o, l.productId()));
        var locked =
                lock(
                        o,
                        List.of(c.sourceLocationId(), c.destinationLocationId()),
                        c.lines().stream().map(OutLine::productId).toList());
        var d =
                document(
                        o,
                        DocumentType.TRANSFER,
                        c.sourceLocationId(),
                        c.destinationLocationId(),
                        c.reason(),
                        c.reference());
        List<StockMovement> ms = new ArrayList<>();
        for (var line : c.lines()) {
            var p = product(o, line.productId());
            var q = Quantities.requirePositive(line.quantity(), p.unit(), "quantity");
            var source = locked.get(c.sourceLocationId() + ":" + p.id());
            var target = locked.get(c.destinationLocationId() + ":" + p.id());
            var allocations = outgoing(o, c.sourceLocationId(), p, line);
            if (!p.batchTracked()) {
                move(o, d, source, null, MovementType.TRANSFER_OUT, q, p, ms);
                move(o, d, target, null, MovementType.TRANSFER_IN, q, p, ms);
            } else
                for (var a : allocations) {
                    var b = a.batch();
                    var dest =
                            incoming(
                                    o,
                                    c.destinationLocationId(),
                                    p,
                                    b.batchNumber(),
                                    b.manufacturingDate(),
                                    b.expirationDate());
                    require(
                            Objects.equals(b.manufacturingDate(), dest.manufacturingDate())
                                    && Objects.equals(b.expirationDate(), dest.expirationDate()),
                            "BATCH_DATES_MISMATCH");
                    move(o, d, source, b, MovementType.TRANSFER_OUT, a.quantity(), p, ms);
                    move(o, d, target, dest, MovementType.TRANSFER_IN, a.quantity(), p, ms);
                }
        }
        return finish(d, ms);
    }
}
