package com.stockhub.stock.application.port;

import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.stock.application.query.StockFilters;
import com.stockhub.stock.domain.model.Batch;
import com.stockhub.stock.domain.model.StockDocument;
import com.stockhub.stock.domain.model.StockMovement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Read side of the stock tables (no locks); names are resolved by the caller. */
public interface StockReadRepository {

    record LevelRow(UUID productId, UUID locationId, BigDecimal quantity, Instant updatedAt) {}

    PageResult<LevelRow> levels(UUID companyId, StockFilters.Levels filter, PageQuery page);

    PageResult<StockMovement> movements(
            UUID companyId, StockFilters.Movements filter, PageQuery page);

    /** Batches matching the filter; expiry filtering is done by the caller (it needs "today"). */
    List<Batch> batches(UUID companyId, StockFilters.Batches filter);

    Map<UUID, String> batchNumbers(UUID companyId, List<UUID> batchIds);

    PageResult<StockDocument> documents(
            UUID companyId, StockFilters.Documents filter, PageQuery page);

    Optional<StockDocument> document(UUID companyId, UUID documentId);

    List<StockMovement> documentLines(UUID companyId, UUID documentId);
}
