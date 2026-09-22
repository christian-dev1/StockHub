package com.stockhub.dashboard.presentation.controller;

import com.stockhub.dashboard.application.dto.DashboardViews.PlatformDashboard;
import com.stockhub.dashboard.application.usecase.PlatformDashboardQueries;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/platform/dashboard")
@Tag(name = "Platform", description = "Company administration (super admin)")
class PlatformDashboardController {

    private final PlatformDashboardQueries queries;

    PlatformDashboardController(PlatformDashboardQueries queries) {
        this.queries = queries;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PLATFORM_STATS_VIEW')")
    @Operation(
            summary =
                    "Platform totals, new companies and stock operations per bucket (UTC days),"
                            + " latest administrative events (PLATFORM_STATS_VIEW)")
    PlatformDashboard dashboard(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return queries.dashboard(period, from, to);
    }
}
