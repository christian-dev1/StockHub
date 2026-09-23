package com.stockhub.stock;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Public stock boundary used by the sales module: issues sold quantities in the caller's
 * transaction (same locks, FEFO and negative-stock rules as any goods-issued note).
 */
public interface StockSalePort {

    /**
     * @throws com.stockhub.shared.domain.exception.ForbiddenException LOCATION_ACCESS_DENIED
     * @throws com.stockhub.shared.domain.exception.BusinessRuleViolationException INSUFFICIENT_STOCK
     */
    IssuedSale issue(UUID locationId, String saleNumber, List<Line> lines);

    record Line(UUID productId, BigDecimal quantity) {}

    /** The goods-issued note created for the sale and the name of the user who performed it. */
    record IssuedSale(UUID documentId, String documentNumber, String performedByName) {}
}
