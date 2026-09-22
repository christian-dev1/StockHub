package com.stockhub.stock.infrastructure.persistence;

import com.stockhub.stock.domain.model.*;
import com.stockhub.stock.domain.repository.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.*;

@Repository
public class JdbcStockRepository
        implements StockLevelRepository, BatchRepository, StockMovementRepository {
    private final JdbcTemplate jdbc;

    public JdbcStockRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public StockLevel lock(UUID company, UUID location, UUID product) {
        jdbc.update(
                "INSERT INTO stock_levels(id,company_id,location_id,product_id) VALUES (?,?,?,?) ON"
                        + " CONFLICT DO NOTHING",
                UUID.randomUUID(),
                company,
                location,
                product);
        return jdbc.queryForObject(
                "SELECT * FROM stock_levels WHERE company_id=? AND location_id=? AND product_id=?"
                        + " FOR UPDATE",
                (r, n) ->
                        new StockLevel(
                                r.getObject("id", UUID.class),
                                company,
                                location,
                                product,
                                r.getBigDecimal("quantity"),
                                r.getLong("version")),
                company,
                location,
                product);
    }

    public void save(StockLevel s) {
        jdbc.update(
                "UPDATE stock_levels SET quantity=?,version=version+1 WHERE id=? AND company_id=?",
                s.quantity(),
                s.id(),
                s.companyId());
    }

    public boolean productHoldsStock(UUID c, UUID p) {
        return Boolean.TRUE.equals(
                jdbc.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM stock_levels WHERE company_id=? AND"
                                + " product_id=? AND quantity<>0)",
                        Boolean.class,
                        c,
                        p));
    }

    public boolean locationHoldsStock(UUID c, UUID l) {
        return Boolean.TRUE.equals(
                jdbc.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM stock_levels WHERE company_id=? AND"
                                + " location_id=? AND quantity<>0)",
                        Boolean.class,
                        c,
                        l));
    }

    private Batch batch(ResultSet r, int n) throws SQLException {
        return new Batch(
                r.getObject("id", UUID.class),
                r.getObject("company_id", UUID.class),
                r.getObject("location_id", UUID.class),
                r.getObject("product_id", UUID.class),
                r.getString("batch_number"),
                r.getBigDecimal("quantity"),
                r.getObject("manufacturing_date", java.time.LocalDate.class),
                r.getObject("expiration_date", java.time.LocalDate.class),
                BatchStatus.valueOf(r.getString("status")),
                r.getLong("version"));
    }

    public List<Batch> lockAvailable(UUID c, UUID l, UUID p) {
        return jdbc.query(
                "SELECT * FROM batches WHERE company_id=? AND location_id=? AND product_id=? ORDER"
                        + " BY id FOR UPDATE",
                this::batch,
                c,
                l,
                p);
    }

    public Optional<Batch> lockById(UUID c, UUID id) {
        return jdbc
                .query(
                        "SELECT * FROM batches WHERE company_id=? AND id=? FOR UPDATE",
                        this::batch,
                        c,
                        id)
                .stream()
                .findFirst();
    }

    public Optional<Batch> lockByNumber(UUID c, UUID l, UUID p, String number) {
        return jdbc
                .query(
                        "SELECT * FROM batches WHERE company_id=? AND location_id=? AND"
                                + " product_id=? AND lower(batch_number)=lower(?) FOR UPDATE",
                        this::batch,
                        c,
                        l,
                        p,
                        number)
                .stream()
                .findFirst();
    }

    public void save(Batch b) {
        jdbc.update(
                "INSERT INTO"
                    + " batches(id,company_id,location_id,product_id,batch_number,quantity,manufacturing_date,expiration_date,status)"
                    + " VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET"
                    + " quantity=excluded.quantity,status=excluded.status,version=batches.version+1",
                b.id(),
                b.companyId(),
                b.locationId(),
                b.productId(),
                b.batchNumber(),
                b.quantity(),
                b.manufacturingDate(),
                b.expirationDate(),
                b.status().name());
    }

    public void add(StockDocument d) {
        jdbc.update(
                "INSERT INTO"
                    + " stock_documents(id,company_id,type,number,location_id,destination_location_id,reason,reference,performed_by,performed_by_name,created_at)"
                    + " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                d.id(),
                d.companyId(),
                d.type().name(),
                d.number(),
                d.locationId(),
                d.destinationLocationId(),
                d.reason(),
                d.reference(),
                d.performedBy(),
                d.performedByName(),
                Timestamp.from(d.createdAt()));
    }

    public void append(List<StockMovement> movements) {
        for (var m : movements) {
            jdbc.update(
                    "INSERT INTO"
                        + " stock_movements(id,company_id,location_id,product_id,batch_id,document_id,type,quantity,previous_quantity,new_quantity,reason,reference,performed_by,created_at)"
                        + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    m.id(),
                    m.companyId(),
                    m.locationId(),
                    m.productId(),
                    m.batchId(),
                    m.documentId(),
                    m.type().name(),
                    m.quantity(),
                    m.previousQuantity(),
                    m.newQuantity(),
                    m.reason(),
                    m.reference(),
                    m.performedBy(),
                    Timestamp.from(m.createdAt()));
            jdbc.update(
                    "INSERT INTO"
                        + " stock_document_lines(id,document_id,product_id,batch_id,quantity,previous_quantity,new_quantity,movement_id)"
                        + " VALUES (?,?,?,?,?,?,?,?)",
                    UUID.randomUUID(),
                    m.documentId(),
                    m.productId(),
                    m.batchId(),
                    m.quantity(),
                    m.previousQuantity(),
                    m.newQuantity(),
                    m.id());
        }
    }
}
