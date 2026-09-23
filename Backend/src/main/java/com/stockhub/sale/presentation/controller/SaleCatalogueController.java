package com.stockhub.sale.presentation.controller;

import com.stockhub.sale.application.dto.SellableProduct;
import com.stockhub.sale.application.usecase.SaleCatalogueQueries;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Read-only catalogue of a point of sale: sale price and sellable quantity, no purchase price. */
@RestController
@RequestMapping("/api/v1/sales/catalogue")
@Tag(name = "Sales")
class SaleCatalogueController {
    private final SaleCatalogueQueries catalogue;

    SaleCatalogueController(SaleCatalogueQueries catalogue) {
        this.catalogue = catalogue;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') and hasAuthority('STOCK_VIEW')")
    @Operation(
            summary = "Active products sellable at a location (PRODUCT_VIEW + STOCK_VIEW)",
            description =
                    "search matches the name or SKU (contains) or the exact barcode, exact codes first."
                            + " categoryId includes its sub-categories. The location must be one the user"
                            + " may access (403 LOCATION_ACCESS_DENIED).")
    PageResponse<SellableProduct> search(
            @RequestParam UUID locationId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "false") boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(
                catalogue.search(locationId, search, categoryId, inStock, PageQuery.of(page, size)), p -> p);
    }

    @GetMapping("/{productId}")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') and hasAuthority('STOCK_VIEW')")
    @Operation(summary = "One sellable product with its availability at a location")
    SellableProduct get(@PathVariable UUID productId, @RequestParam UUID locationId) {
        return catalogue.get(productId, locationId);
    }
}
