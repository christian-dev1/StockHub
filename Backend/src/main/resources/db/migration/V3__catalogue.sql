-- Phase 3: catalogue (categories, suppliers, products, product images, imports).

CREATE TABLE categories (
    id          UUID PRIMARY KEY,
    company_id  UUID         NOT NULL REFERENCES companies (id),
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_id   UUID         REFERENCES categories (id),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by  UUID,
    updated_by  UUID,
    version     BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT ck_categories_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE UNIQUE INDEX uq_categories_company_name ON categories (company_id, lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX ix_categories_parent ON categories (parent_id);
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

CREATE TABLE suppliers (
    id             UUID PRIMARY KEY,
    company_id     UUID         NOT NULL REFERENCES companies (id),
    code           VARCHAR(30)  NOT NULL,
    name           VARCHAR(150) NOT NULL,
    contact_name   VARCHAR(150),
    email          VARCHAR(254),
    phone          VARCHAR(40),
    address_line   VARCHAR(255),
    city           VARCHAR(100),
    country        VARCHAR(2),
    tax_id         VARCHAR(50),
    lead_time_days INTEGER CHECK (lead_time_days BETWEEN 0 AND 365),
    notes          VARCHAR(1000),
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    deleted_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by     UUID,
    updated_by     UUID,
    version        BIGINT       NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uq_suppliers_company_code ON suppliers (company_id, lower(code)) WHERE deleted_at IS NULL;
CREATE INDEX ix_suppliers_company_name ON suppliers (company_id, lower(name));
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

CREATE TABLE products (
    id                  UUID PRIMARY KEY,
    company_id          UUID          NOT NULL REFERENCES companies (id),
    sku                 VARCHAR(50)   NOT NULL,
    barcode             VARCHAR(64),
    barcode_format      VARCHAR(20)   CHECK (barcode_format IN ('CODE128', 'EAN13', 'EAN8', 'UPC_A')),
    name                VARCHAR(200)  NOT NULL,
    description         VARCHAR(2000),
    category_id         UUID          REFERENCES categories (id),
    default_supplier_id UUID          REFERENCES suppliers (id),
    unit                VARCHAR(10)   NOT NULL CHECK (unit IN ('UNIT', 'KG', 'G', 'L', 'ML', 'M', 'BOX', 'PACK')),
    purchase_price      NUMERIC(19, 4) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
    sale_price          NUMERIC(19, 4) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
    min_stock           NUMERIC(19, 3) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    reorder_quantity    NUMERIC(19, 3) CHECK (reorder_quantity > 0),
    batch_tracked       BOOLEAN       NOT NULL DEFAULT FALSE,
    expiry_tracked      BOOLEAN       NOT NULL DEFAULT FALSE,
    active              BOOLEAN       NOT NULL DEFAULT TRUE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_by          UUID,
    updated_by          UUID,
    version             BIGINT        NOT NULL DEFAULT 0,
    -- Expiry dates are carried by batches, so expiry tracking requires batch tracking.
    CONSTRAINT ck_products_expiry_needs_batch CHECK (NOT expiry_tracked OR batch_tracked),
    CONSTRAINT ck_products_barcode_format CHECK ((barcode IS NULL) = (barcode_format IS NULL))
);
CREATE UNIQUE INDEX uq_products_company_sku ON products (company_id, lower(sku)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_products_company_barcode ON products (company_id, barcode)
    WHERE barcode IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_products_company_name ON products (company_id, lower(name));
CREATE INDEX ix_products_name_trgm ON products USING gin (lower(name) gin_trgm_ops);
CREATE INDEX ix_products_category ON products (category_id);
CREATE INDEX ix_products_supplier ON products (default_supplier_id);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

-- Images are small (≤ 2 MB, validated by content) and kept in the database so
-- that backups and multi-instance deployments need no shared file system.
CREATE TABLE product_images (
    product_id   UUID PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
    company_id   UUID         NOT NULL REFERENCES companies (id),
    content_type VARCHAR(50)  NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
    size_bytes   INTEGER      NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 2097152),
    data         BYTEA        NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- A previewed import keeps its validated rows so the commit re-checks and
-- applies exactly what the user reviewed, without uploading the file again.
CREATE TABLE import_jobs (
    id           UUID PRIMARY KEY,
    company_id   UUID         NOT NULL REFERENCES companies (id),
    type         VARCHAR(20)  NOT NULL CHECK (type IN ('PRODUCTS')),
    file_name    VARCHAR(255) NOT NULL,
    status       VARCHAR(20)  NOT NULL CHECK (status IN ('PREVIEWED', 'COMMITTED')),
    total_rows   INTEGER      NOT NULL,
    error_rows   INTEGER      NOT NULL,
    create_missing_categories BOOLEAN NOT NULL DEFAULT FALSE,
    rows         JSONB        NOT NULL,
    user_id      UUID         NOT NULL REFERENCES users (id),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ  NOT NULL,
    committed_at TIMESTAMPTZ,
    version      BIGINT       NOT NULL DEFAULT 0
);
CREATE INDEX ix_import_jobs_company_time ON import_jobs (company_id, created_at DESC);
