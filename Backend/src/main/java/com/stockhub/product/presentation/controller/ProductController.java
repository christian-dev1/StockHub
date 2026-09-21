package com.stockhub.product.presentation.controller;

import com.stockhub.product.application.query.ProductSearchQuery;
import com.stockhub.product.application.usecase.ChangeProductStatusUseCase;
import com.stockhub.product.application.usecase.CreateProductUseCase;
import com.stockhub.product.application.usecase.DeleteProductUseCase;
import com.stockhub.product.application.usecase.ProductQueries;
import com.stockhub.product.application.usecase.UpdateProductUseCase;
import com.stockhub.product.domain.repository.ProductSearchCriteria;
import com.stockhub.product.presentation.request.ProductRequest;
import com.stockhub.product.presentation.request.UpdateProductRequest;
import com.stockhub.product.presentation.response.ProductResponse;
import com.stockhub.shared.web.PageRequestParams;
import com.stockhub.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products")
class ProductController {

    private static final Set<String> SORTABLE = Set.of("name", "sku", "salePrice", "purchasePrice", "minStock",
            "createdAt", "updatedAt");

    private final ProductQueries queries;
    private final CreateProductUseCase create;
    private final UpdateProductUseCase update;
    private final ChangeProductStatusUseCase changeStatus;
    private final DeleteProductUseCase delete;

    ProductController(ProductQueries queries, CreateProductUseCase create, UpdateProductUseCase update,
                      ChangeProductStatusUseCase changeStatus, DeleteProductUseCase delete) {
        this.queries = queries;
        this.create = create;
        this.update = update;
        this.changeStatus = changeStatus;
        this.delete = delete;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    @Operation(summary = "Search the catalogue; every filter is optional and combinable")
    PageResponse<ProductResponse> search(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) UUID categoryId,
                                         @RequestParam(required = false) UUID supplierId,
                                         @RequestParam(required = false) Boolean active,
                                         @RequestParam(required = false) Boolean batchTracked,
                                         @RequestParam(required = false) Boolean expiryTracked,
                                         @RequestParam(required = false) Boolean hasBarcode,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size,
                                         @RequestParam(required = false) String sort) {
        var criteria = new ProductSearchCriteria(q, categoryId, supplierId, active, batchTracked, expiryTracked, hasBarcode);
        var pageQuery = PageRequestParams.toQuery(page, size, sort, SORTABLE, "name");
        return PageResponse.of(queries.search(new ProductSearchQuery(criteria, pageQuery)), ProductResponse::from);
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    @Operation(summary = "Find a product by scanned barcode (exact), then by SKU")
    ProductResponse lookup(@RequestParam String code) {
        return ProductResponse.from(queries.lookup(code));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW')")
    ProductResponse get(@PathVariable UUID id) {
        return ProductResponse.from(queries.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE')")
    ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        var view = create.execute(request.toCommand());
        return ResponseEntity.created(URI.create("/api/v1/products/" + view.id())).body(ProductResponse.from(view));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    ProductResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest request) {
        return ProductResponse.from(update.execute(id, request.product().toCommand(), request.version()));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    ProductResponse deactivate(@PathVariable UUID id) {
        return ProductResponse.from(changeStatus.deactivate(id));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    ProductResponse activate(@PathVariable UUID id) {
        return ProductResponse.from(changeStatus.activate(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE')")
    @Operation(summary = "Soft-delete a product that holds no stock")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        delete.execute(id);
        return ResponseEntity.noContent().build();
    }
}
