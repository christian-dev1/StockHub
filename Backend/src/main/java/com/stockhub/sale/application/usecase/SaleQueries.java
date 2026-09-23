package com.stockhub.sale.application.usecase;

import com.stockhub.company.CompanySnapshot;
import com.stockhub.sale.application.dto.SaleListItem;
import com.stockhub.sale.application.dto.SaleSettingsView;
import com.stockhub.sale.application.dto.SaleView;
import com.stockhub.sale.application.dto.SellerSummaryView;
import com.stockhub.sale.application.port.SaleReadModel;
import com.stockhub.sale.domain.exception.SaleErrors;
import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.SaleStatus;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.shared.security.CurrentUser;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/** Read side of sales, always scoped by {@link SaleAccess}. */
@Service
@Transactional(readOnly = true)
public class SaleQueries {
    public static final int MAX_SUMMARY_DAYS = 90;
    private static final int TOP_PRODUCTS = 5;
    private static final int RECENT_SALES = 5;

    private final SaleAccess access;
    private final SaleReadModel reads;

    SaleQueries(SaleAccess access, SaleReadModel reads) {
        this.access = access;
        this.reads = reads;
    }

    /**
     * @param mine only the caller's own sales; always true for a VENDEUR, whatever is asked
     * @param from first day included (company time zone); @param to last day included
     */
    public PageResult<SaleListItem> search(
            String search,
            LocalDate from,
            LocalDate to,
            PaymentMethod paymentMethod,
            SaleStatus status,
            boolean mine,
            PageQuery page) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidInputException("from", "DATE_RANGE_INVALID", "The start date is after the end date.");
        }
        ZoneId zone = access.zone(access.company());
        String text = search == null || search.isBlank() ? null : search.strip();
        return reads.search(
                access.scope(mine),
                new SaleReadModel.Criteria(
                        text,
                        from == null ? null : startOf(from, zone),
                        to == null ? null : startOf(to.plusDays(1), zone),
                        paymentMethod,
                        status),
                page);
    }

    /** A sale the caller may see; others answer 404 so that their existence is not revealed. */
    public SaleView get(UUID id) {
        CurrentUser user = access.user();
        return reads.find(user.requireCompanyId(), id)
                .filter(access::canSee)
                .orElseThrow(() -> SaleErrors.saleNotFound(id));
    }

    /** The caller's own activity: today and the last {@code days} days (today included). */
    public SellerSummaryView mySummary(int days) {
        if (days < 1 || days > MAX_SUMMARY_DAYS) {
            throw new InvalidInputException("days", "DAYS_INVALID", "Choose between 1 and %s days.", MAX_SUMMARY_DAYS);
        }
        CurrentUser user = access.user();
        UUID companyId = user.requireCompanyId();
        CompanySnapshot company = access.company();
        ZoneId zone = access.zone(company);
        LocalDate today = access.today(company);
        Instant dayStart = startOf(today, zone);
        Instant tomorrow = startOf(today.plusDays(1), zone);
        Instant periodStart = startOf(today.minusDays(days - 1L), zone);

        var recent =
                reads.search(
                                access.scope(true),
                                new SaleReadModel.Criteria(null, null, null, null, null),
                                new PageQuery(0, RECENT_SALES, "createdAt", false))
                        .content();
        return new SellerSummaryView(
                company.currency(),
                today,
                days,
                withAverage(reads.totals(companyId, user.userId(), dayStart, tomorrow)),
                withAverage(reads.totals(companyId, user.userId(), periodStart, tomorrow)),
                reads.topProducts(companyId, user.userId(), periodStart, tomorrow, TOP_PRODUCTS),
                recent);
    }

    /** Currency, stock rule and payment methods the point of sale must use. */
    public SaleSettingsView settings() {
        CompanySnapshot company = access.company();
        return new SaleSettingsView(
                company.currency(), company.allowNegativeStock(), List.of(PaymentMethod.values()));
    }

    private static SellerSummaryView.Totals withAverage(SellerSummaryView.Totals totals) {
        BigDecimal average =
                totals.salesCount() == 0
                        ? BigDecimal.ZERO
                        : totals.revenue()
                                .divide(BigDecimal.valueOf(totals.salesCount()), 4, RoundingMode.HALF_UP);
        return new SellerSummaryView.Totals(totals.salesCount(), totals.revenue(), average);
    }

    private static Instant startOf(LocalDate day, ZoneId zone) {
        return day.atStartOfDay(zone).toInstant();
    }
}
