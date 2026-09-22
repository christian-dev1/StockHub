package com.stockhub.stock.domain.repository;

import com.stockhub.stock.domain.model.Batch;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Every method locks the returned batches until the end of the transaction. */
public interface BatchRepository {

    List<Batch> lockAvailable(UUID companyId, UUID locationId, UUID productId);

    Optional<Batch> lockById(UUID companyId, UUID batchId);

    Optional<Batch> lockByNumber(
            UUID companyId, UUID locationId, UUID productId, String batchNumber);

    void save(Batch batch);
}
