package com.stockhub.sale.application.usecase;

import com.stockhub.sale.application.dto.SellableProduct;
import com.stockhub.sale.application.port.SaleReadModel;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.shared.security.LocationAccessPolicy;
import com.stockhub.warehouse.LocationApi;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Catalogue seen from a point of sale: active products with their sale price and the quantity
 * that can be sold at one location the caller may access.
 */
@Service
@Transactional(readOnly = true)
public class SaleCatalogueQueries {
    private final SaleAccess access;
    private final SaleReadModel reads;
    private final LocationApi locations;
    private final LocationAccessPolicy locationAccess;

    SaleCatalogueQueries(
            SaleAccess access,
            SaleReadModel reads,
            LocationApi locations,
            LocationAccessPolicy locationAccess) {
        this.access = access;
        this.reads = reads;
        this.locations = locations;
        this.locationAccess = locationAccess;
    }

    public PageResult<SellableProduct> search(
            UUID locationId, String search, UUID categoryId, boolean inStockOnly, PageQuery page) {
        UUID companyId = requireLocation(locationId);
        String text = search == null || search.isBlank() ? null : search.strip();
        return reads.catalogue(
                companyId, locationId, access.today(access.company()), text, categoryId, inStockOnly, page);
    }

    public SellableProduct get(UUID productId, UUID locationId) {
        UUID companyId = requireLocation(locationId);
        return reads.sellable(companyId, locationId, access.today(access.company()), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
    }

    /** An active location of the caller's company that the caller may access (403 otherwise). */
    private UUID requireLocation(UUID locationId) {
        if (locationId == null) {
            throw new InvalidInputException("locationId", "LOCATION_REQUIRED", "A location is required.");
        }
        UUID companyId = access.user().requireCompanyId();
        if (locations.findActiveIds(companyId, List.of(locationId)).isEmpty()) {
            throw new ResourceNotFoundException("Location", locationId);
        }
        locationAccess.requireAccess(locationId);
        return companyId;
    }
}
