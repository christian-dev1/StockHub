package com.stockhub.stock.domain.model;

/** Stock notes and the prefix of their human readable number (BE-2026-000001…). */
public enum DocumentType {
    ENTRY("BE"),
    EXIT("BS"),
    ADJUSTMENT("AJ"),
    TRANSFER("TR");

    private final String prefix;

    DocumentType(String prefix) {
        this.prefix = prefix;
    }

    public String prefix() {
        return prefix;
    }

    /** Name of the per-company, per-year counter in document_sequences. */
    public String sequence() {
        return "STOCK_" + name();
    }
}
