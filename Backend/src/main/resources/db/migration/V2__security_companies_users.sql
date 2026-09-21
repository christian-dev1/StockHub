-- Phase 2: companies, locations, roles & permissions, users, auth tokens, audit.

CREATE TABLE companies (
    id                   UUID PRIMARY KEY,
    name                 VARCHAR(150) NOT NULL,
    legal_name           VARCHAR(200),
    email                VARCHAR(254),
    phone                VARCHAR(40),
    address_line         VARCHAR(255),
    city                 VARCHAR(100),
    country              VARCHAR(2),
    currency             VARCHAR(3)   NOT NULL,
    timezone             VARCHAR(64)  NOT NULL,
    locale               VARCHAR(5)   NOT NULL DEFAULT 'fr',
    status               VARCHAR(20)  NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    allow_negative_stock BOOLEAN      NOT NULL DEFAULT FALSE,
    expiry_warning_days  INTEGER      NOT NULL DEFAULT 30 CHECK (expiry_warning_days BETWEEN 1 AND 365),
    default_lead_time_days INTEGER    NOT NULL DEFAULT 7 CHECK (default_lead_time_days BETWEEN 0 AND 365),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by           UUID,
    updated_by           UUID,
    version              BIGINT       NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uq_companies_name ON companies (lower(name));
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

CREATE TABLE locations (
    id           UUID PRIMARY KEY,
    company_id   UUID         NOT NULL REFERENCES companies (id),
    code         VARCHAR(30)  NOT NULL,
    name         VARCHAR(150) NOT NULL,
    type         VARCHAR(20)  NOT NULL CHECK (type IN ('STORE', 'WAREHOUSE', 'DEPOT')),
    address_line VARCHAR(255),
    city         VARCHAR(100),
    phone        VARCHAR(40),
    is_primary   BOOLEAN      NOT NULL DEFAULT FALSE,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    deleted_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by   UUID,
    updated_by   UUID,
    version      BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT ck_locations_primary_active CHECK (NOT is_primary OR (active AND deleted_at IS NULL))
);
CREATE UNIQUE INDEX uq_locations_company_code ON locations (company_id, lower(code)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_locations_company_primary ON locations (company_id) WHERE is_primary;
CREATE INDEX ix_locations_company ON locations (company_id);
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

CREATE TABLE roles (
    code        VARCHAR(30) PRIMARY KEY,
    is_platform BOOLEAN     NOT NULL,
    rank        SMALLINT    NOT NULL
);

CREATE TABLE permissions (
    code   VARCHAR(50) PRIMARY KEY,
    module VARCHAR(30) NOT NULL
);

CREATE TABLE role_permissions (
    role_code       VARCHAR(30) NOT NULL REFERENCES roles (code),
    permission_code VARCHAR(50) NOT NULL REFERENCES permissions (code),
    PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE users (
    id                   UUID PRIMARY KEY,
    company_id           UUID         REFERENCES companies (id),
    email                VARCHAR(254) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    first_name           VARCHAR(80)  NOT NULL,
    last_name            VARCHAR(80)  NOT NULL,
    phone                VARCHAR(40),
    role                 VARCHAR(30)  NOT NULL REFERENCES roles (code),
    all_locations        BOOLEAN      NOT NULL DEFAULT FALSE,
    status               VARCHAR(20)  NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
    token_version        INTEGER      NOT NULL DEFAULT 0,
    last_login_at        TIMESTAMPTZ,
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by           UUID,
    updated_by           UUID,
    version              BIGINT       NOT NULL DEFAULT 0,
    -- A platform super admin never belongs to a company; everybody else always does.
    CONSTRAINT ck_users_company_scope CHECK ((role = 'SUPER_ADMIN') = (company_id IS NULL))
);
CREATE UNIQUE INDEX uq_users_email ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX ix_users_company ON users (company_id);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION stockhub_set_updated_at();

CREATE TABLE user_locations (
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations (id),
    PRIMARY KEY (user_id, location_id)
);
CREATE INDEX ix_user_locations_location ON user_locations (location_id);

CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users (id),
    family_id    UUID         NOT NULL,
    token_hash   VARCHAR(64)  NOT NULL,
    issued_at    TIMESTAMPTZ  NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    revoked_at   TIMESTAMPTZ,
    revoke_reason VARCHAR(30),
    token_version INTEGER      NOT NULL,
    replaced_by  UUID,
    created_ip   VARCHAR(45),
    user_agent   VARCHAR(255)
);
CREATE UNIQUE INDEX uq_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX ix_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX ix_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY,
    company_id  UUID,
    user_id     UUID,
    actor_email VARCHAR(254),
    action      VARCHAR(60)  NOT NULL,
    entity_type VARCHAR(60)  NOT NULL,
    entity_id   VARCHAR(64),
    old_value   JSONB,
    new_value   JSONB,
    metadata    JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(255),
    request_id  VARCHAR(64),
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_company_time ON audit_logs (company_id, occurred_at DESC);
CREATE INDEX ix_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX ix_audit_logs_user_time ON audit_logs (user_id, occurred_at DESC);
CREATE TRIGGER trg_audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION stockhub_forbid_mutation();

-- ---------------------------------------------------------------------------
-- Reference data: roles, permissions and the role → permission matrix.
-- ---------------------------------------------------------------------------
INSERT INTO roles (code, is_platform, rank) VALUES
    ('SUPER_ADMIN', TRUE, 100),
    ('ADMIN', FALSE, 40),
    ('MANAGER', FALSE, 30),
    ('MAGASINIER', FALSE, 20),
    ('VENDEUR', FALSE, 10);

INSERT INTO permissions (code, module) VALUES
    ('PLATFORM_STATS_VIEW', 'platform'), ('PLATFORM_SETTINGS_MANAGE', 'platform'), ('SUPPORT_SESSION_OPEN', 'platform'),
    ('COMPANY_VIEW', 'company'), ('COMPANY_CREATE', 'company'), ('COMPANY_UPDATE', 'company'), ('COMPANY_DISABLE', 'company'),
    ('USER_VIEW', 'user'), ('USER_CREATE', 'user'), ('USER_UPDATE', 'user'), ('USER_DISABLE', 'user'),
    ('WAREHOUSE_VIEW', 'warehouse'), ('WAREHOUSE_CREATE', 'warehouse'), ('WAREHOUSE_UPDATE', 'warehouse'),
    ('CATEGORY_VIEW', 'product'), ('CATEGORY_MANAGE', 'product'),
    ('PRODUCT_VIEW', 'product'), ('PRODUCT_CREATE', 'product'), ('PRODUCT_UPDATE', 'product'),
    ('PRODUCT_DELETE', 'product'), ('PRODUCT_IMPORT', 'product'),
    ('BARCODE_GENERATE', 'barcode'), ('BARCODE_PRINT', 'barcode'),
    ('SUPPLIER_VIEW', 'supplier'), ('SUPPLIER_CREATE', 'supplier'), ('SUPPLIER_UPDATE', 'supplier'),
    ('STOCK_VIEW', 'stock'), ('STOCK_ENTRY', 'stock'), ('STOCK_EXIT', 'stock'), ('STOCK_ADJUST', 'stock'),
    ('STOCK_TRANSFER', 'stock'), ('BATCH_MANAGE', 'stock'),
    ('INVENTORY_VIEW', 'inventory'), ('INVENTORY_CREATE', 'inventory'), ('INVENTORY_COUNT', 'inventory'),
    ('INVENTORY_VALIDATE', 'inventory'),
    ('PURCHASE_ORDER_VIEW', 'purchase'), ('PURCHASE_ORDER_CREATE', 'purchase'),
    ('PURCHASE_ORDER_VALIDATE', 'purchase'), ('PURCHASE_ORDER_RECEIVE', 'purchase'),
    ('SALE_CREATE', 'sale'), ('SALE_VIEW', 'sale'), ('SALE_CANCEL', 'sale'), ('RECEIPT_REPRINT', 'sale'),
    ('ALERT_VIEW', 'alert'), ('ALERT_MANAGE', 'alert'),
    ('REPORT_VIEW', 'report'), ('REPORT_EXPORT', 'report'),
    ('FORECAST_VIEW', 'forecasting'),
    ('AUDIT_VIEW', 'audit');

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'SUPER_ADMIN', code FROM permissions
WHERE code IN ('PLATFORM_STATS_VIEW', 'PLATFORM_SETTINGS_MANAGE', 'SUPPORT_SESSION_OPEN',
               'COMPANY_VIEW', 'COMPANY_CREATE', 'COMPANY_UPDATE', 'COMPANY_DISABLE',
               'USER_VIEW', 'USER_CREATE', 'REPORT_VIEW', 'AUDIT_VIEW');

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'ADMIN', code FROM permissions
WHERE module <> 'platform' AND code NOT IN ('COMPANY_CREATE', 'COMPANY_DISABLE');

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'MANAGER', code FROM permissions
WHERE code IN ('COMPANY_VIEW', 'USER_VIEW', 'WAREHOUSE_VIEW', 'CATEGORY_VIEW', 'CATEGORY_MANAGE',
               'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_IMPORT',
               'BARCODE_GENERATE', 'BARCODE_PRINT', 'SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_UPDATE',
               'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_ADJUST', 'STOCK_TRANSFER', 'BATCH_MANAGE',
               'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_COUNT', 'INVENTORY_VALIDATE',
               'PURCHASE_ORDER_VIEW', 'PURCHASE_ORDER_CREATE', 'PURCHASE_ORDER_VALIDATE', 'PURCHASE_ORDER_RECEIVE',
               'SALE_CREATE', 'SALE_VIEW', 'SALE_CANCEL', 'RECEIPT_REPRINT',
               'ALERT_VIEW', 'ALERT_MANAGE', 'REPORT_VIEW', 'REPORT_EXPORT', 'FORECAST_VIEW');

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'MAGASINIER', code FROM permissions
WHERE code IN ('WAREHOUSE_VIEW', 'CATEGORY_VIEW', 'PRODUCT_VIEW', 'BARCODE_GENERATE', 'BARCODE_PRINT',
               'SUPPLIER_VIEW', 'STOCK_VIEW', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_TRANSFER', 'BATCH_MANAGE',
               'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_COUNT',
               'PURCHASE_ORDER_VIEW', 'PURCHASE_ORDER_RECEIVE', 'ALERT_VIEW', 'ALERT_MANAGE', 'REPORT_VIEW');

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'VENDEUR', code FROM permissions
WHERE code IN ('WAREHOUSE_VIEW', 'CATEGORY_VIEW', 'PRODUCT_VIEW', 'STOCK_VIEW',
               'SALE_CREATE', 'SALE_VIEW', 'RECEIPT_REPRINT');
