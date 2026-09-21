package com.stockhub.product;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Public, read-mostly API of the catalogue for other modules. Every lookup is scoped by company. */
public interface ProductCatalog {

    Optional<ProductSummary> find(UUID companyId, UUID productId);

    Map<UUID, ProductSummary> findByIds(UUID companyId, Collection<UUID> productIds);

    /** Finds an active or inactive (not deleted) product by its exact barcode, then by SKU. */
    Optional<ProductSummary> findByCode(UUID companyId, String code);

    boolean barcodeExists(UUID companyId, String barcode);

    /**
     * Assigns a barcode (validated against its symbology and unique per company)
     * in the caller's transaction, and audits the change.
     */
    ProductSummary assignBarcode(UUID companyId, UUID productId, String barcode, String format);
}
