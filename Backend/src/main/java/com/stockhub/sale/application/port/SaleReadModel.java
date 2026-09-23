package com.stockhub.sale.application.port;

import com.stockhub.sale.application.dto.SaleListItem;
import com.stockhub.sale.application.dto.SaleView;
import com.stockhub.sale.application.dto.SellableProduct;
import com.stockhub.sale.application.dto.SellerSummaryView;
import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.SaleStatus;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** SQL read side of sales and of the sellable catalogue. Scope always comes from the caller. */
public interface SaleReadModel {

    /**
     * Who may be seen: {@code sellerId} restricts to one seller's sales, {@code locationIds}
     * (null = every location) to the sales of those locations. Both apply when both are set.
     */
    record Scope(UUID companyId, UUID sellerId, Set<UUID> locationIds) {}

    /**
     * @param search sale number or customer name (contains, case-insensitive)
     * @param from first instant included; @param to first instant excluded
     */
    record Criteria(
            String search, Instant from, Instant to, PaymentMethod paymentMethod, SaleStatus status) {}

    PageResult<SaleListItem> search(Scope scope, Criteria criteria, PageQuery page);

    Optional<SaleView> find(UUID companyId, UUID saleId);

    SellerSummaryView.Totals totals(UUID companyId, UUID sellerId, Instant from, Instant to);

    List<SellerSummaryView.TopProduct> topProducts(
            UUID companyId, UUID sellerId, Instant from, Instant to, int limit);

    /**
     * @param search name or SKU (contains), or exact barcode
     * @param today company day used to exclude expired batches
     */
    PageResult<SellableProduct> catalogue(
            UUID companyId,
            UUID locationId,
            LocalDate today,
            String search,
            UUID categoryId,
            boolean inStockOnly,
            PageQuery page);

    Optional<SellableProduct> sellable(
            UUID companyId, UUID locationId, LocalDate today, UUID productId);
}
