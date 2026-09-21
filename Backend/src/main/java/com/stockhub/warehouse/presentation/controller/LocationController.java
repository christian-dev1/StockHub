package com.stockhub.warehouse.presentation.controller;

import com.stockhub.warehouse.application.usecase.ListAccessibleLocationsQuery;
import com.stockhub.warehouse.presentation.response.LocationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/locations")
@Tag(name = "Locations")
class LocationController {

    private final ListAccessibleLocationsQuery listAccessible;

    LocationController(ListAccessibleLocationsQuery listAccessible) {
        this.listAccessible = listAccessible;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('WAREHOUSE_VIEW')")
    @Operation(summary = "Active locations of the current company accessible to the current user")
    List<LocationResponse> list() {
        return listAccessible.execute().stream().map(LocationResponse::from).toList();
    }
}
