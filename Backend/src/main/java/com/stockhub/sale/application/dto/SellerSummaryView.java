package com.stockhub.sale.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Personal activity of the signed-in seller only (never other sellers' figures). Days are
 * calendar days in the company time zone.
 *
 * @param today sales of the current day
 * @param lastDays sales of the last {@code days} days, today included
 * @param topProducts products this seller sold the most over the same days
 */
public record SellerSummaryView(
        String currency,
        LocalDate date,
        int days,
        Totals today,
        Totals lastDays,
        List<TopProduct> topProducts,
        List<SaleListItem> recentSales) {

    /** @param averageBasket revenue / sales count, zero when there is no sale */
    public record Totals(long salesCount, BigDecimal revenue, BigDecimal averageBasket) {}

    public record TopProduct(
            UUID productId, String productName, String sku, BigDecimal quantity, BigDecimal revenue) {}
}
