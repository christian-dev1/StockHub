package com.stockhub.product.application.usecase;

import com.stockhub.product.ProductUsageGuard;
import com.stockhub.product.domain.exception.ProductErrors;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.model.ProductDetails;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.product.domain.repository.ProductRepository;
import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.shared.application.SequenceGenerator;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.supplier.SupplierApi;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

/** Tenant-scoped loading, uniqueness and reference checks shared by the product use cases. */
@Component
class ProductAccess {

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final SupplierApi suppliers;
    private final SequenceGenerator sequences;
    private final CurrentUserProvider currentUser;
    private final List<ProductUsageGuard> usageGuards;

    ProductAccess(ProductRepository products, CategoryRepository categories, SupplierApi suppliers,
                  SequenceGenerator sequences, CurrentUserProvider currentUser, List<ProductUsageGuard> usageGuards) {
        this.products = products;
        this.categories = categories;
        this.suppliers = suppliers;
        this.sequences = sequences;
        this.currentUser = currentUser;
        this.usageGuards = usageGuards;
    }

    UUID companyId() {
        return currentUser.require().requireCompanyId();
    }

    Product load(UUID productId) {
        return products.findById(companyId(), productId).orElseThrow(() -> ProductErrors.notFound(productId));
    }

    Product load(UUID productId, long expectedVersion) {
        Product product = load(productId);
        if (product.version() != expectedVersion) {
            throw new OptimisticLockingFailureException("Product " + productId + " was modified concurrently");
        }
        return product;
    }

    void requireUniqueSku(UUID companyId, String sku, UUID excludedId) {
        if (products.existsBySku(companyId, sku.strip(), excludedId)) {
            throw ProductErrors.skuAlreadyUsed();
        }
    }

    void requireUniqueBarcode(UUID companyId, Barcode barcode, UUID excludedId) {
        if (barcode != null && products.existsByBarcode(companyId, barcode.value(), excludedId)) {
            throw ProductErrors.barcodeAlreadyUsed();
        }
    }

    /**
     * The category must belong to the company; the supplier must too, and be
     * active unless it is the one already linked (keeping it is allowed).
     */
    void requireValidReferences(UUID companyId, ProductDetails details, UUID currentSupplierId) {
        if (details.categoryId() != null && categories.findById(companyId, details.categoryId()).isEmpty()) {
            throw ProductErrors.unknownCategory();
        }
        UUID supplierId = details.defaultSupplierId();
        if (supplierId != null) {
            boolean usable = suppliers.find(companyId, supplierId)
                    .map(s -> s.active() || Objects.equals(supplierId, currentSupplierId))
                    .orElse(false);
            if (!usable) {
                throw ProductErrors.unknownSupplier();
            }
        }
    }

    boolean holdsStock(UUID companyId, UUID productId) {
        return usageGuards.stream().anyMatch(guard -> guard.holdsStock(companyId, productId));
    }

    /** Generated SKUs skip values already chosen manually. */
    String nextSku(UUID companyId) {
        String sku;
        do {
            sku = "PRD-%06d".formatted(sequences.next(companyId, "PRODUCT_SKU"));
        } while (products.existsBySku(companyId, sku, null));
        return sku;
    }
}
