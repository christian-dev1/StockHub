-- Phase 6: dashboards.
-- Stock valuation (quantities × purchase prices) is financial data: dashboards
-- compute it only for the roles holding STOCK_VALUE_VIEW.
INSERT INTO permissions (code, module) VALUES ('STOCK_VALUE_VIEW', 'stock');

INSERT INTO role_permissions (role_code, permission_code) VALUES
    ('ADMIN', 'STOCK_VALUE_VIEW'),
    ('MANAGER', 'STOCK_VALUE_VIEW');

-- Company-wide activity over a period (entries vs exits chart) without a location filter.
CREATE INDEX ix_stock_movements_company_time ON stock_movements (company_id, created_at);
