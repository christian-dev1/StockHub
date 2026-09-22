package com.stockhub.warehouse.presentation.controller;

import com.stockhub.warehouse.application.usecase.ChangeLocationStatusUseCase;
import com.stockhub.warehouse.application.usecase.CreateLocationUseCase;
import com.stockhub.warehouse.application.usecase.LocationQueries;
import com.stockhub.warehouse.application.usecase.SetPrimaryLocationUseCase;
import com.stockhub.warehouse.application.usecase.UpdateLocationUseCase;
import com.stockhub.warehouse.presentation.request.LocationRequest;
import com.stockhub.warehouse.presentation.request.UpdateLocationRequest;
import com.stockhub.warehouse.presentation.response.LocationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/locations")
@Tag(name = "Locations", description = "Stores, warehouses and depots of the current company")
class LocationController {

    private final LocationQueries queries;
    private final CreateLocationUseCase create;
    private final UpdateLocationUseCase update;
    private final ChangeLocationStatusUseCase changeStatus;
    private final SetPrimaryLocationUseCase setPrimary;

    LocationController(LocationQueries queries, CreateLocationUseCase create, UpdateLocationUseCase update,
                       ChangeLocationStatusUseCase changeStatus, SetPrimaryLocationUseCase setPrimary) {
        this.queries = queries;
        this.create = create;
        this.update = update;
        this.changeStatus = changeStatus;
        this.setPrimary = setPrimary;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('WAREHOUSE_VIEW')")
    @Operation(summary = "Locations accessible to the current user (inactive ones only for location managers)")
    List<LocationResponse> list(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return queries.list(includeInactive).stream().map(LocationResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('WAREHOUSE_VIEW')")
    LocationResponse get(@PathVariable UUID id) {
        return LocationResponse.from(queries.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WAREHOUSE_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    ResponseEntity<LocationResponse> create(@Valid @RequestBody LocationRequest request) {
        var view = create.execute(request.toCommand());
        return ResponseEntity.created(URI.create("/api/v1/locations/" + view.id())).body(LocationResponse.from(view));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WAREHOUSE_UPDATE')")
    LocationResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateLocationRequest request) {
        return LocationResponse.from(update.execute(id, request.location().toCommand(), request.version()));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('WAREHOUSE_UPDATE')")
    LocationResponse deactivate(@PathVariable UUID id) {
        return LocationResponse.from(changeStatus.deactivate(id));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('WAREHOUSE_UPDATE')")
    LocationResponse activate(@PathVariable UUID id) {
        return LocationResponse.from(changeStatus.activate(id));
    }

    @PostMapping("/{id}/set-primary")
    @PreAuthorize("hasAuthority('WAREHOUSE_UPDATE')")
    @Operation(summary = "Make this location the company's primary location")
    LocationResponse setPrimary(@PathVariable UUID id) {
        return LocationResponse.from(setPrimary.execute(id));
    }
}
