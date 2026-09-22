package com.stockhub.stock.domain.repository;

import com.stockhub.stock.domain.model.StockLevel;

import java.util.UUID;

public interface StockLevelRepository {

    /**
     * Returns the level of a product in a location, creating it at zero when missing, and locks it
     * until the end of the transaction.
     */
    StockLevel lock(UUID companyId, UUID locationId, UUID productId);

    void save(StockLevel level);

    boolean productHoldsStock(UUID companyId, UUID productId);

    boolean locationHoldsStock(UUID companyId, UUID locationId);
}
