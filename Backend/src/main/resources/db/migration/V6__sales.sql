-- Phase 7 (first slice): point-of-sale sales.
--
-- A sale is an immutable commercial record: product names, SKUs, prices, the
-- seller's name and the currency are copied at the time of the sale so that a
-- receipt reprinted later shows exactly what was sold.
-- There is no customer master: the optional customer name is plain text.
CREATE TABLE sales (
    id                UUID PRIMARY KEY,
    company_id        UUID           NOT NULL REFERENCES companies (id),
    location_id       UUID           NOT NULL REFERENCES locations (id),
    number            VARCHAR(30)    NOT NULL,
    status            VARCHAR(20)    NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED')),
    seller_id         UUID           NOT NULL REFERENCES users (id),
    seller_name       VARCHAR(160)   NOT NULL,
    customer_name     VARCHAR(120),
    payment_method    VARCHAR(20)    NOT NULL
        CHECK (payment_method IN ('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'OTHER')),
    currency          VARCHAR(3)     NOT NULL,
    total_amount      NUMERIC(19, 4) NOT NULL CHECK (total_amount >= 0),
    -- The goods-issued note (BS) produced by the stock engine for this sale.
    stock_document_id UUID           NOT NULL REFERENCES stock_documents (id),
    -- Client-generated key: a retried submission returns the original sale.
    idempotency_key   VARCHAR(80),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT uq_sales_company_number UNIQUE (company_id, number)
);
CREATE UNIQUE INDEX uq_sales_idempotency ON sales (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX ix_sales_company_seller_time ON sales (company_id, seller_id, created_at DESC);
CREATE INDEX ix_sales_company_location_time ON sales (company_id, location_id, created_at DESC);
CREATE TRIGGER trg_sales_append_only BEFORE UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION stockhub_forbid_mutation();

CREATE TABLE sale_lines (
    id           UUID PRIMARY KEY,
    sale_id      UUID           NOT NULL REFERENCES sales (id),
    position     SMALLINT       NOT NULL,
    product_id   UUID           NOT NULL REFERENCES products (id),
    product_name VARCHAR(200)   NOT NULL,
    sku          VARCHAR(50)    NOT NULL,
    unit         VARCHAR(10)    NOT NULL,
    quantity     NUMERIC(19, 3) NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(19, 4) NOT NULL CHECK (unit_price >= 0),
    line_total   NUMERIC(19, 4) NOT NULL CHECK (line_total >= 0),
    CONSTRAINT uq_sale_lines_position UNIQUE (sale_id, position)
);
CREATE INDEX ix_sale_lines_product ON sale_lines (product_id);
CREATE TRIGGER trg_sale_lines_append_only BEFORE UPDATE OR DELETE ON sale_lines
    FOR EACH ROW EXECUTE FUNCTION stockhub_forbid_mutation();
