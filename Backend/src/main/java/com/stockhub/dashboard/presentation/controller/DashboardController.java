package com.stockhub.dashboard.presentation.controller;

import com.stockhub.dashboard.application.dto.DashboardViews.*;
import com.stockhub.dashboard.application.usecase.CompanyDashboardQueries;
import com.stockhub.dashboard.application.usecase.CompanyDashboardQueries.Request;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Company dashboard (STOCK_VIEW). Common parameters: {@code period} = TODAY, 7D, 30D (default),
 * 3M, 1Y or CUSTOM with {@code from}/{@code to} (YYYY-MM-DD, company time zone); optional {@code
 * locationId}, which must be one of the user's locations.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(
        name = "Dashboard",
        description =
                "Aggregated stock figures of the current company. Stock values need"
                        + " STOCK_VALUE_VIEW (null otherwise). No sales figures until the sale"
                        + " module exists.")
@ApiResponses({
    @ApiResponse(responseCode = "400", description = "INVALID_PERIOD or INVALID_FILTER"),
    @ApiResponse(responseCode = "403", description = "FORBIDDEN or LOCATION_ACCESS_DENIED"),
    @ApiResponse(responseCode = "404", description = "LOCATION_NOT_FOUND")
})
class DashboardController {

    private final CompanyDashboardQueries queries;

    DashboardController(CompanyDashboardQueries queries) {
        this.queries = queries;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(
            summary = "KPIs, stock status, batches to watch, stock per location and items to act on")
    Summary summary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID locationId) {
        return queries.summary(new Request(period, from, to, locationId));
    }

    @GetMapping("/stock-flow")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(
            summary = "Entries vs exits per bucket (hour, day, week or month), zero-filled")
    StockFlow stockFlow(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID locationId) {
        return queries.flow(new Request(period, from, to, locationId));
    }

    @GetMapping("/recent-activity")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(summary = "Latest stock operations (one per stock note), newest first")
    List<RecentOperation> recentActivity(
            @Parameter(description = "ENTRY, EXIT, TRANSFER or ADJUSTMENT") @RequestParam(required = false)
                    String type,
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(required = false) UUID locationId) {
        return queries.recentActivity(new Request(null, null, null, locationId), type, limit);
    }

    @GetMapping("/top-movements")
    @PreAuthorize("hasAuthority('STOCK_VIEW')")
    @Operation(summary = "Products involved in the most stock operations over the period")
    TopMovements topMovements(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(defaultValue = "5") int limit) {
        return queries.topMovements(new Request(period, from, to, locationId), limit);
    }
}
