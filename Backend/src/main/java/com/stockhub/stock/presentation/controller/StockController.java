package com.stockhub.stock.presentation.controller;

import com.stockhub.shared.domain.page.*;
import com.stockhub.shared.web.PageRequestParams;
import com.stockhub.shared.web.PageResponse;
import com.stockhub.stock.application.command.StockCommands.*;
import com.stockhub.stock.application.usecase.*;
import com.stockhub.stock.domain.model.StockDocument;
import com.stockhub.stock.presentation.response.StockResponses;

import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "Invalid quantity, fields or filters"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "403",
            description = "Permission missing or LOCATION_ACCESS_DENIED"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404",
            description = "RESOURCE_NOT_FOUND, including foreign-company resources"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "409",
            description = "STOCK_CONFLICT: retry the whole operation"),
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "422",
            description =
                    "INSUFFICIENT_STOCK, BATCH_REQUIRED, BATCH_EXPIRED, INVALID_TRANSFER or other"
                            + " business rule")
})
@Tag(
        name = "Stock",
        description =
                "Tenant and location scoped stock. Errors: INSUFFICIENT_STOCK, QUANTITY_INVALID,"
                        + " INVALID_TRANSFER, BATCH_REQUIRED, BATCH_EXPIRED, RESOURCE_NOT_FOUND,"
                        + " LOCATION_ACCESS_DENIED, STOCK_CONFLICT.")
class StockController {
    private final EnterStockUseCase entry;
    private final ExitStockUseCase exit;
    private final AdjustStockUseCase adjustment;
    private final TransferStockUseCase transfer;
    private final StockQueries queries;

    StockController(
            EnterStockUseCase entry,
            ExitStockUseCase exit,
            AdjustStockUseCase adjustment,
            TransferStockUseCase transfer,
            StockQueries queries) {
        this.entry = entry;
        this.exit = exit;
        this.adjustment = adjustment;
        this.transfer = transfer;
        this.queries = queries;
    }

    private PageQuery page(Map<String, String> f) {
        try {
            return PageRequestParams.toQuery(
                    Integer.parseInt(f.getOrDefault("page", "0")),
                    Integer.parseInt(f.getOrDefault("size", "20")),
                    f.get("sort"),
                    Set.of(
                            "createdAt",
                            "updatedAt",
                            "quantity",
                            "expirationDate",
                            "batchNumber",
                            "reference",
                            "type"),
                    "createdAt");
        } catch (NumberFormatException e) {
            throw new com.stockhub.shared.domain.exception.InvalidInputException(
                    "page", "INVALID_FILTER", "Invalid pagination.");
        }
    }

    @io.swagger.v3.oas.annotations.Parameters({
        @io.swagger.v3.oas.annotations.Parameter(
                name = "locationId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "page",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "size",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "sort",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "productId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "search",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "lowStock",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "outOfStock",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY)
    })
    @GetMapping("/stocks")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(
            summary = "List stocks (STOCK_VIEW)",
            description =
                    "Filters: locationId, productId, search, lowStock, outOfStock, type,"
                        + " performedBy, reference, dateFrom, dateTo, batchNumber, expirationFrom,"
                        + " expirationTo, status (VALID, EXPIRING_SOON, EXPIRED). Pagination:"
                        + " page=0, size=20 (max 100), sort=field,asc|desc. Applicable filters"
                        + " combine with AND.")
    PageResponse<StockResponses.Level> stocks(
            @io.swagger.v3.oas.annotations.Parameter(hidden = true) @RequestParam
                    Map<String, String> filters) {
        return PageResponse.of(
                queries.list("stocks", filters, page(filters)), StockResponses.Level::from);
    }

    @GetMapping("/stocks/{id}")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(summary = "Read stocks (STOCK_VIEW); inaccessible resources return 404")
    PageResponse<StockResponses.Level> product(
            @PathVariable UUID id,
            @io.swagger.v3.oas.annotations.Parameter(hidden = true) @RequestParam
                    Map<String, String> filters) {
        return PageResponse.of(
                queries.product(id, filters, page(filters)), StockResponses.Level::from);
    }

    @io.swagger.v3.oas.annotations.Parameters({
        @io.swagger.v3.oas.annotations.Parameter(
                name = "locationId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "page",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "size",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "sort",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "productId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "type",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "performedBy",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "reference",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "dateFrom",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "dateTo",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY)
    })
    @GetMapping("/stock-movements")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(
            summary = "List stock-movements (STOCK_VIEW)",
            description =
                    "Filters: locationId, productId, search, lowStock, outOfStock, type,"
                        + " performedBy, reference, dateFrom, dateTo, batchNumber, expirationFrom,"
                        + " expirationTo, status (VALID, EXPIRING_SOON, EXPIRED). Pagination:"
                        + " page=0, size=20 (max 100), sort=field,asc|desc. Applicable filters"
                        + " combine with AND.")
    PageResponse<StockResponses.Movement> stockmovements(
            @io.swagger.v3.oas.annotations.Parameter(hidden = true) @RequestParam
                    Map<String, String> filters) {
        return PageResponse.of(
                queries.list("stock-movements", filters, page(filters)),
                StockResponses.Movement::from);
    }

    @GetMapping("/stock-movements/{id}")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(summary = "Read stock-movements (STOCK_VIEW); inaccessible resources return 404")
    StockResponses.Movement stockmovementsDetail(@PathVariable UUID id) {
        return StockResponses.Movement.from(queries.get("stock-movements", id));
    }

    @io.swagger.v3.oas.annotations.Parameters({
        @io.swagger.v3.oas.annotations.Parameter(
                name = "locationId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "page",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "size",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "sort",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "productId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "batchNumber",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "expirationFrom",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "expirationTo",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "status",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY)
    })
    @GetMapping("/batches")
    @PreAuthorize("hasAuthority('BATCH_MANAGE')")
    @Operation(
            summary = "List batches (BATCH_MANAGE)",
            description =
                    "Filters: locationId, productId, search, lowStock, outOfStock, type,"
                        + " performedBy, reference, dateFrom, dateTo, batchNumber, expirationFrom,"
                        + " expirationTo, status (VALID, EXPIRING_SOON, EXPIRED). Pagination:"
                        + " page=0, size=20 (max 100), sort=field,asc|desc. Applicable filters"
                        + " combine with AND.")
    PageResponse<StockResponses.BatchView> batches(
            @io.swagger.v3.oas.annotations.Parameter(hidden = true) @RequestParam
                    Map<String, String> filters) {
        return PageResponse.of(
                queries.list("batches", filters, page(filters)), StockResponses.BatchView::from);
    }

    @GetMapping("/batches/{id}")
    @PreAuthorize("hasAuthority('BATCH_MANAGE')")
    @Operation(summary = "Read batches (BATCH_MANAGE); inaccessible resources return 404")
    StockResponses.BatchView batchesDetail(@PathVariable UUID id) {
        return StockResponses.BatchView.from(queries.get("batches", id));
    }

    @io.swagger.v3.oas.annotations.Parameters({
        @io.swagger.v3.oas.annotations.Parameter(
                name = "locationId",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "page",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "size",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "sort",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "type",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "reference",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "dateFrom",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY),
        @io.swagger.v3.oas.annotations.Parameter(
                name = "dateTo",
                in = io.swagger.v3.oas.annotations.enums.ParameterIn.QUERY)
    })
    @GetMapping("/stock-documents")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(
            summary = "List stock-documents (STOCK_VIEW)",
            description =
                    "Filters: locationId, productId, search, lowStock, outOfStock, type,"
                        + " performedBy, reference, dateFrom, dateTo, batchNumber, expirationFrom,"
                        + " expirationTo, status (VALID, EXPIRING_SOON, EXPIRED). Pagination:"
                        + " page=0, size=20 (max 100), sort=field,asc|desc. Applicable filters"
                        + " combine with AND.")
    PageResponse<StockResponses.Document> stockdocuments(
            @io.swagger.v3.oas.annotations.Parameter(hidden = true) @RequestParam
                    Map<String, String> filters) {
        return PageResponse.of(
                queries.list("stock-documents", filters, page(filters)),
                StockResponses.Document::from);
    }

    @GetMapping("/stock-documents/{id}")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(summary = "Read stock-documents (STOCK_VIEW); inaccessible resources return 404")
    StockResponses.Document stockdocumentsDetail(@PathVariable UUID id) {
        return StockResponses.Document.from(queries.get("stock-documents", id));
    }

    @PostMapping("/stock/entries")
    @PreAuthorize("hasAuthority('STOCK_ENTRY')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "entry stock (STOCK_ENTRY)",
            description =
                    "Atomic operation with document, movements and audit. Quantity must be"
                        + " positive. Expired batches are excluded from normal exits and transfers."
                        + " Transfers require access to both locations.")
    StockDocument entry(@RequestBody Entry command) {
        return entry.execute(command);
    }

    @PostMapping("/stock/exits")
    @PreAuthorize("hasAuthority('STOCK_EXIT')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "exit stock (STOCK_EXIT)",
            description =
                    "Atomic operation with document, movements and audit. Quantity must be"
                        + " positive. Expired batches are excluded from normal exits and transfers."
                        + " Transfers require access to both locations.")
    StockDocument exit(@RequestBody Exit command) {
        return exit.execute(command);
    }

    @PostMapping("/stock/adjustments")
    @PreAuthorize("hasAuthority('STOCK_ADJUST')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "adjustment stock (STOCK_ADJUST)",
            description =
                    "Atomic operation with document, movements and audit. Quantity must be"
                        + " positive. Expired batches are excluded from normal exits and transfers."
                        + " Transfers require access to both locations.")
    StockDocument adjustment(@RequestBody Adjustment command) {
        return adjustment.execute(command);
    }

    @PostMapping("/stock/transfers")
    @PreAuthorize("hasAuthority('STOCK_TRANSFER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "transfer stock (STOCK_TRANSFER)",
            description =
                    "Atomic operation with document, movements and audit. Quantity must be"
                        + " positive. Expired batches are excluded from normal exits and transfers."
                        + " Transfers require access to both locations.")
    StockDocument transfer(@RequestBody Transfer command) {
        return transfer.execute(command);
    }
}
