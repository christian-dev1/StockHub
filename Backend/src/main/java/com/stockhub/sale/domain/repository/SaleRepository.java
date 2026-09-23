package com.stockhub.sale.domain.repository;

import com.stockhub.sale.domain.model.Sale;

import java.util.Optional;
import java.util.UUID;

/** Write side of sales; every lookup is scoped by company. */
public interface SaleRepository {

    void add(Sale sale);

    /** The sale already recorded for a client submission key, if any. */
    Optional<RecordedSale> findByIdempotencyKey(UUID companyId, String idempotencyKey);

    record RecordedSale(UUID id, UUID sellerId) {}
}
