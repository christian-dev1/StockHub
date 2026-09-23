package com.stockhub.stock.domain.model;

/** Kind of stock change; each one either adds to or removes from a stock level. */
public enum MovementType {
    ENTRY(true),
    EXIT(false),
    TRANSFER_OUT(false),
    TRANSFER_IN(true),
    ADJUSTMENT_POSITIVE(true),
    ADJUSTMENT_NEGATIVE(false),
    RETURN_CUSTOMER(true),
    RETURN_SUPPLIER(false),
    /** Produced only by the sales module (StockSalePort). */
    SALE(false);

    private final boolean increase;

    MovementType(boolean increase) {
        this.increase = increase;
    }

    public boolean increases() {
        return increase;
    }
}
