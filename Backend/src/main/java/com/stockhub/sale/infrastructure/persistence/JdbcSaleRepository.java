package com.stockhub.sale.infrastructure.persistence;

import com.stockhub.sale.domain.model.Sale;
import com.stockhub.sale.domain.model.SaleLine;
import com.stockhub.sale.domain.repository.SaleRepository;
import com.stockhub.shared.domain.Ids;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

/** Sales and their lines are inserted once and never updated (append-only triggers). */
@Repository
class JdbcSaleRepository implements SaleRepository {
    private final JdbcClient jdbc;

    JdbcSaleRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void add(Sale sale) {
        jdbc.sql(
                        """
                        INSERT INTO sales (id, company_id, location_id, number, status, seller_id, seller_name,
                                           customer_name, payment_method, currency, total_amount,
                                           stock_document_id, idempotency_key, created_at)
                        VALUES (:id, :company, :location, :number, :status, :seller, :sellerName,
                                :customer, :payment, :currency, :total, :document, :key, :createdAt)
                        """)
                .param("id", sale.id())
                .param("company", sale.companyId())
                .param("location", sale.locationId())
                .param("number", sale.number())
                .param("status", sale.status().name())
                .param("seller", sale.sellerId())
                .param("sellerName", sale.sellerName())
                .param("customer", sale.customerName())
                .param("payment", sale.paymentMethod().name())
                .param("currency", sale.currency())
                .param("total", sale.totalAmount())
                .param("document", sale.stockDocumentId())
                .param("key", sale.idempotencyKey())
                .param("createdAt", Timestamp.from(sale.createdAt()))
                .update();
        for (SaleLine line : sale.lines()) {
            jdbc.sql(
                            """
                            INSERT INTO sale_lines (id, sale_id, position, product_id, product_name, sku, unit,
                                                    quantity, unit_price, line_total)
                            VALUES (:id, :sale, :position, :product, :name, :sku, :unit, :quantity, :price, :total)
                            """)
                    .param("id", Ids.newId())
                    .param("sale", sale.id())
                    .param("position", line.position())
                    .param("product", line.productId())
                    .param("name", line.productName())
                    .param("sku", line.sku())
                    .param("unit", line.unit())
                    .param("quantity", line.quantity())
                    .param("price", line.unitPrice())
                    .param("total", line.lineTotal())
                    .update();
        }
    }

    @Override
    public Optional<RecordedSale> findByIdempotencyKey(UUID companyId, String idempotencyKey) {
        return jdbc.sql(
                        "SELECT id, seller_id FROM sales WHERE company_id = :company AND idempotency_key = :key")
                .param("company", companyId)
                .param("key", idempotencyKey)
                .query(
                        (rs, n) ->
                                new RecordedSale(
                                        rs.getObject("id", UUID.class),
                                        rs.getObject("seller_id", UUID.class)))
                .optional();
    }
}
