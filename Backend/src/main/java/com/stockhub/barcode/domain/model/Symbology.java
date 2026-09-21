package com.stockhub.barcode.domain.model;

/** Symbologies StockHub can render; GTIN variants carry a GS1 check digit. */
public enum Symbology {
    CODE128,
    EAN13,
    EAN8,
    UPC_A;

    /** Only these two are generated; EAN-8 and UPC-A come from manufacturers. */
    public boolean isGeneratable() {
        return this == CODE128 || this == EAN13;
    }
}
