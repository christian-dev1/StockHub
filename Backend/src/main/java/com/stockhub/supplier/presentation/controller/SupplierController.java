package com.stockhub.supplier.presentation.controller;

import com.stockhub.shared.web.PageRequestParams;
import com.stockhub.shared.web.PageResponse;
import com.stockhub.supplier.application.query.SupplierSearchQuery;
import com.stockhub.supplier.application.usecase.ChangeSupplierStatusUseCase;
import com.stockhub.supplier.application.usecase.CreateSupplierUseCase;
import com.stockhub.supplier.application.usecase.SupplierQueries;
import com.stockhub.supplier.application.usecase.UpdateSupplierUseCase;
import com.stockhub.supplier.presentation.request.SupplierRequest;
import com.stockhub.supplier.presentation.request.UpdateSupplierRequest;
import com.stockhub.supplier.presentation.response.SupplierResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;
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
@RequestMapping("/api/v1/suppliers")
@Tag(name = "Suppliers")
class SupplierController {

    private static final Set<String> SORTABLE = Set.of("code", "name", "city", "leadTimeDays", "createdAt");

    private final SupplierQueries queries;
    private final CreateSupplierUseCase create;
    private final UpdateSupplierUseCase update;
    private final ChangeSupplierStatusUseCase changeStatus;

    SupplierController(SupplierQueries queries, CreateSupplierUseCase create, UpdateSupplierUseCase update,
                       ChangeSupplierStatusUseCase changeStatus) {
        this.queries = queries;
        this.create = create;
        this.update = update;
        this.changeStatus = changeStatus;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPPLIER_VIEW')")
    @Operation(summary = "Search suppliers (name, code, contact, email, city)")
    PageResponse<SupplierResponse> search(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) Boolean active,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size,
                                          @RequestParam(required = false) String sort) {
        var pageQuery = PageRequestParams.toQuery(page, size, sort, SORTABLE, "name");
        return PageResponse.of(queries.search(new SupplierSearchQuery(q, active, pageQuery)), SupplierResponse::from);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_VIEW')")
    SupplierResponse get(@PathVariable UUID id) {
        return SupplierResponse.from(queries.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPPLIER_CREATE')")
    @Operation(summary = "Create a supplier (the code is generated when omitted)")
    @ResponseStatus(HttpStatus.CREATED)
    ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        var view = create.execute(request.toCommand());
        return ResponseEntity.created(URI.create("/api/v1/suppliers/" + view.id())).body(SupplierResponse.from(view));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    SupplierResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateSupplierRequest request) {
        return SupplierResponse.from(update.execute(id, request.supplier().toCommand(), request.version()));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    SupplierResponse deactivate(@PathVariable UUID id) {
        return SupplierResponse.from(changeStatus.deactivate(id));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('SUPPLIER_UPDATE')")
    SupplierResponse activate(@PathVariable UUID id) {
        return SupplierResponse.from(changeStatus.activate(id));
    }
}
