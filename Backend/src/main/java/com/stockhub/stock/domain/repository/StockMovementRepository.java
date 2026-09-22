package com.stockhub.stock.domain.repository;

import com.stockhub.stock.domain.model.StockDocument;
import com.stockhub.stock.domain.model.StockMovement;

import java.util.List;

/** Append-only: there is no update nor delete. */
public interface StockMovementRepository {

    void add(StockDocument document);

    void append(List<StockMovement> movements);
}
