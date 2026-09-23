package com.stockhub.sale.presentation.controller;

import com.stockhub.sale.application.dto.SaleListItem;
import com.stockhub.sale.application.dto.SaleSettingsView;
import com.stockhub.sale.application.dto.SaleView;
import com.stockhub.sale.application.dto.SellerSummaryView;
import com.stockhub.sale.application.usecase.SaleQueries;
import com.stockhub.sale.application.usecase.SaleUseCases;
import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.SaleStatus;
import com.stockhub.sale.presentation.request.CreateSaleRequest;
import com.stockhub.shared.web.PageRequestParams;
import com.stockhub.shared.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sales")
@Tag(name = "Sales")
class SaleController {
    private static final Set<String> SORTABLE = Set.of("createdAt", "number", "totalAmount");

    private final SaleUseCases sales;
    private final SaleQueries queries;

    SaleController(SaleUseCases sales, SaleQueries queries) {
        this.sales = sales;
        this.queries = queries;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SALE_CREATE')")
    @Operation(
            summary = "Record a sale (SALE_CREATE)",
            description =
                    "Prices and totals are computed by the server from the catalogue. Stock is issued"
                            + " atomically (SALE movements, FEFO, no negative stock unless allowed) at a"
                            + " location the user may access. Send an Idempotency-Key header to make"
                            + " retries safe: the same key returns the original sale.")
    ResponseEntity<SaleView> create(
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody CreateSaleRequest request) {
        SaleView sale = sales.create(request.toCommand(idempotencyKey));
        return ResponseEntity.created(URI.create("/api/v1/sales/" + sale.id())).body(sale);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SALE_VIEW')")
    @Operation(
            summary = "List sales (SALE_VIEW)",
            description =
                    "A VENDEUR always gets only his own sales, whatever the parameters. Other roles get"
                            + " the sales of the locations they may access, or their own with mine=true."
                            + " search matches the sale number or the customer name; from/to are days"
                            + " (inclusive) in the company time zone.")
    PageResponse<SaleListItem> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(defaultValue = "false") boolean mine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        var pageQuery = PageRequestParams.toQuery(page, size, sort, SORTABLE, "createdAt");
        return PageResponse.of(
                queries.search(search, from, to, paymentMethod, status, mine, pageQuery), s -> s);
    }

    @GetMapping("/me/summary")
    @PreAuthorize("hasAuthority('SALE_VIEW')")
    @Operation(
            summary = "Personal sales activity of the signed-in user (SALE_VIEW)",
            description = "Today and the last `days` days (1–90, today included); never other users' figures.")
    SellerSummaryView mySummary(@RequestParam(defaultValue = "7") int days) {
        return queries.mySummary(days);
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAuthority('SALE_CREATE')")
    @Operation(summary = "Currency, negative-stock rule and payment methods of the point of sale (SALE_CREATE)")
    SaleSettingsView settings() {
        return queries.settings();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SALE_VIEW')")
    @Operation(summary = "Read a sale with its lines (SALE_VIEW); sales the user may not see return 404")
    SaleView get(@PathVariable UUID id) {
        return queries.get(id);
    }
}
