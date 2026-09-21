-- StockHub baseline: extensions, shared helpers, document numbering and the
-- Spring Modulith event publication registry.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Keeps updated_at in sync on every UPDATE for tables that opt in.
CREATE OR REPLACE FUNCTION stockhub_set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rejects UPDATE/DELETE on append-only ledgers (stock movements, audit logs).
CREATE OR REPLACE FUNCTION stockhub_forbid_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Table % is append-only: % is not allowed', TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

-- Human readable references (BE-2026-000001, PO-2026-000001, ...).
-- Incremented with UPDATE ... RETURNING inside the business transaction, which
-- row-locks the counter and guarantees gap-free, unique numbers under concurrency.
-- company_id has no FK here: companies are created in a later migration and the
-- counter row is created by the company module together with the company.
CREATE TABLE document_sequences (
    company_id  UUID        NOT NULL,
    doc_type    VARCHAR(20) NOT NULL,
    year        SMALLINT    NOT NULL,
    last_value  BIGINT      NOT NULL DEFAULT 0 CHECK (last_value >= 0),
    PRIMARY KEY (company_id, doc_type, year)
);

-- Spring Modulith 2.x event publication registry (schema v2).
CREATE TABLE event_publication (
    id                     UUID                     NOT NULL PRIMARY KEY,
    listener_id            TEXT                     NOT NULL,
    event_type             TEXT                     NOT NULL,
    serialized_event       TEXT                     NOT NULL,
    publication_date       TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date        TIMESTAMP WITH TIME ZONE,
    status                 TEXT,
    completion_attempts    INT,
    last_resubmission_date TIMESTAMP WITH TIME ZONE
);
CREATE INDEX event_publication_serialized_event_hash_idx ON event_publication USING hash (serialized_event);
CREATE INDEX event_publication_by_completion_date_idx ON event_publication (completion_date);
