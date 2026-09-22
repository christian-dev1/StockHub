-- Phase 4: stock engine (levels per location, batches, documents, movement ledger).

-- Current quantity of a product in a location. The only source of truth for
-- stock: products never carry a quantity. Negative values are only reachable
-- when the company allows negative stock (checked by the application).
CREATE TABLE stock_levels (
    id          UUID PRIMARY KEY,
    company_id  UUID           NOT NULL REFERENCES companies (id),
    location_id UUID           NOT NULL REFERENCES locations (id),
    product_id  UUID           NOT NULL REFERENCES products (id),
    quantity    NUMERIC(19, 3) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    version     BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT uq_stock_levels_company_location_product UNIQUE (company_id, location_id, product_id)
);
CREATE INDEX ix_stock_levels_product ON stock_levels (company_id, product_id);
CREATE TRIGGER trg_stock_levels_updated_at BEFORE UPDATE ON stock_levels
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

-- A batch (lot) of a product held in one location. For batch-tracked
-- products, the batches of a location always add up to its stock level.
CREATE TABLE batches (
    id                 UUID PRIMARY KEY,
    company_id         UUID           NOT NULL REFERENCES companies (id),
    location_id        UUID           NOT NULL REFERENCES locations (id),
    product_id         UUID           NOT NULL REFERENCES products (id),
    batch_number       VARCHAR(80)    NOT NULL,
    quantity           NUMERIC(19, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    manufacturing_date DATE,
    expiration_date    DATE,
    status             VARCHAR(20)    NOT NULL CHECK (status IN ('ACTIVE', 'DEPLETED')),
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    version            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT ck_batches_dates CHECK (manufacturing_date IS NULL OR expiration_date IS NULL
        OR manufacturing_date <= expiration_date),
    CONSTRAINT ck_batches_status CHECK ((status = 'DEPLETED') = (quantity = 0))
);
CREATE UNIQUE INDEX uq_batches_number ON batches (company_id, location_id, product_id, lower(batch_number));
CREATE INDEX ix_batches_fefo ON batches (company_id, location_id, product_id, expiration_date) WHERE status = 'ACTIVE';
CREATE INDEX ix_batches_expiration ON batches (company_id, expiration_date) WHERE status = 'ACTIVE';
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

-- Stock notes: goods received (BE), goods issued (BS), adjustments (AJ) and
-- transfers (TR). Their lines are the movements that reference them.
CREATE TABLE stock_documents (
    id                      UUID PRIMARY KEY,
    company_id              UUID         NOT NULL REFERENCES companies (id),
    type                    VARCHAR(20)  NOT NULL CHECK (type IN ('ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER')),
    number                  VARCHAR(30)  NOT NULL,
    location_id             UUID         NOT NULL REFERENCES locations (id),
    destination_location_id UUID         REFERENCES locations (id),
    reason                  VARCHAR(500),
    reference               VARCHAR(100),
    performed_by            UUID         NOT NULL REFERENCES users (id),
    -- Name at the time of the operation: the note is a historical record.
    performed_by_name       VARCHAR(160) NOT NULL,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_stock_documents_destination CHECK ((type = 'TRANSFER') = (destination_location_id IS NOT NULL)),
    CONSTRAINT ck_stock_documents_transfer CHECK (destination_location_id IS NULL OR destination_location_id <> location_id)
);
CREATE UNIQUE INDEX uq_stock_documents_number ON stock_documents (company_id, number);
CREATE INDEX ix_stock_documents_company_time ON stock_documents (company_id, created_at DESC);
CREATE TRIGGER trg_stock_documents_append_only BEFORE UPDATE OR DELETE ON stock_documents
    FOR EACH ROW EXECUTE FUNCTION stockhub_forbid_mutation();

-- Append-only ledger: every change of a stock level, with the balance before
-- and after it. Rows are never updated nor deleted (trigger).
CREATE TABLE stock_movements (
    id                UUID PRIMARY KEY,
    company_id        UUID           NOT NULL REFERENCES companies (id),
    location_id       UUID           NOT NULL REFERENCES locations (id),
    product_id        UUID           NOT NULL REFERENCES products (id),
    batch_id          UUID           REFERENCES batches (id),
    document_id       UUID           NOT NULL REFERENCES stock_documents (id),
    type              VARCHAR(30)    NOT NULL CHECK (type IN ('ENTRY', 'EXIT', 'TRANSFER_OUT', 'TRANSFER_IN',
                                         'ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE', 'RETURN_CUSTOMER',
                                         'RETURN_SUPPLIER', 'SALE')),
    quantity          NUMERIC(19, 3) NOT NULL CHECK (quantity > 0),
    previous_quantity NUMERIC(19, 3) NOT NULL,
    new_quantity      NUMERIC(19, 3) NOT NULL,
    reason            VARCHAR(500),
    reference         VARCHAR(100),
    performed_by      UUID           NOT NULL REFERENCES users (id),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    sequence          BIGSERIAL      NOT NULL
);
CREATE INDEX ix_stock_movements_product ON stock_movements (company_id, product_id, created_at DESC);
CREATE INDEX ix_stock_movements_location ON stock_movements (company_id, location_id, created_at DESC);
CREATE INDEX ix_stock_movements_document ON stock_movements (document_id);
CREATE TRIGGER trg_stock_movements_append_only BEFORE UPDATE OR DELETE ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION stockhub_forbid_mutation();

CREATE TABLE stock_document_lines (
 id UUID PRIMARY KEY,
 document_id UUID NOT NULL REFERENCES stock_documents(id),
 product_id UUID NOT NULL REFERENCES products(id),
 batch_id UUID REFERENCES batches(id),
 quantity NUMERIC(19,3) NOT NULL CHECK(quantity > 0),
 previous_quantity NUMERIC(19,3) NOT NULL,
 new_quantity NUMERIC(19,3) NOT NULL,
 movement_id UUID NOT NULL UNIQUE REFERENCES stock_movements(id)
);
CREATE INDEX ix_stock_document_lines_document ON stock_document_lines(document_id);
CREATE TRIGGER trg_stock_document_lines_append_only BEFORE UPDATE OR DELETE ON stock_document_lines
 FOR EACH ROW EXECUTE FUNCTION stockhub_forbid_mutation();
