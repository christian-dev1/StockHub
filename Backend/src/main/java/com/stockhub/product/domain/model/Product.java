package com.stockhub.product.domain.model;

import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.product.domain.valueobject.Pricing;
import com.stockhub.product.domain.valueobject.StockPolicy;
import com.stockhub.product.domain.valueobject.Tracking;
import com.stockhub.product.domain.valueobject.Unit;
import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.Texts;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * A sellable / storable article of a company. The product never holds a stock
 * quantity: stock lives in the stock module, per location (and per batch).
 */
public final class Product {

    private final UUID id;
    private final UUID companyId;
    private String sku;
    private Barcode barcode;
    private String name;
    private String description;
    private UUID categoryId;
    private UUID defaultSupplierId;
    private Unit unit;
    private Pricing pricing;
    private StockPolicy stockPolicy;
    private Tracking tracking;
    private boolean active;
    private boolean deleted;
    private final long version;

    public Product(UUID id, UUID companyId, String sku, Barcode barcode, ProductDetails details, Tracking tracking,
                   boolean active, boolean deleted, long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.sku = validSku(sku);
        this.barcode = barcode;
        apply(details);
        this.tracking = Objects.requireNonNull(tracking);
        this.active = active;
        this.deleted = deleted;
        this.version = version;
    }

    public static Product create(UUID companyId, String sku, Barcode barcode, ProductDetails details, Tracking tracking) {
        return new Product(Ids.newId(), companyId, sku, barcode, details, tracking, true, false, 0);
    }

    public void update(String newSku, ProductDetails details) {
        requireNotDeleted();
        this.sku = validSku(newSku);
        apply(details);
    }

    /**
     * Changing batch tracking is only safe while the product holds no stock
     * (existing quantities would have no batch); the caller checks stock.
     */
    public void changeTracking(Tracking newTracking, boolean holdsStock) {
        requireNotDeleted();
        if (newTracking.batchTracked() != tracking.batchTracked() && holdsStock) {
            throw new BusinessRuleViolationException("PRODUCT_TRACKING_LOCKED",
                    "Batch tracking cannot change while the product holds stock.");
        }
        this.tracking = newTracking;
    }

    public boolean changesTracking(Tracking newTracking) {
        return newTracking.batchTracked() != tracking.batchTracked();
    }

    public void assignBarcode(Barcode newBarcode) {
        requireNotDeleted();
        this.barcode = Objects.requireNonNull(newBarcode);
    }

    public void removeBarcode() {
        requireNotDeleted();
        this.barcode = null;
    }

    public void activate() {
        requireNotDeleted();
        active = true;
    }

    public void deactivate() {
        requireNotDeleted();
        active = false;
    }

    /** Soft delete: history (movements, sales, orders) keeps referencing the product. */
    public void delete() {
        requireNotDeleted();
        active = false;
        deleted = true;
    }

    private void apply(ProductDetails details) {
        Objects.requireNonNull(details);
        this.name = Texts.required(details.name(), "name", 200, "PRODUCT");
        this.description = Texts.optional(details.description(), "description", 2000);
        this.categoryId = details.categoryId();
        this.defaultSupplierId = details.defaultSupplierId();
        this.unit = Objects.requireNonNull(details.unit(), "unit");
        this.pricing = details.pricing() == null ? Pricing.ZERO : details.pricing();
        this.stockPolicy = details.stockPolicy() == null ? StockPolicy.NONE : details.stockPolicy();
        requireWholeQuantities();
    }

    private void requireWholeQuantities() {
        if (!unit.isDiscrete()) {
            return;
        }
        if (!isWhole(stockPolicy.minStock())) {
            throw new InvalidInputException("minStock", "QUANTITY_MUST_BE_WHOLE", "This unit only accepts whole quantities.");
        }
        if (stockPolicy.reorderQuantity() != null && !isWhole(stockPolicy.reorderQuantity())) {
            throw new InvalidInputException("reorderQuantity", "QUANTITY_MUST_BE_WHOLE",
                    "This unit only accepts whole quantities.");
        }
    }

    private static boolean isWhole(BigDecimal value) {
        return value.stripTrailingZeros().scale() <= 0;
    }

    private static String validSku(String value) {
        String sku = Texts.required(value, "sku", 50, "PRODUCT").toUpperCase(Locale.ROOT);
        if (!sku.matches("[A-Z0-9][A-Z0-9._/-]*")) {
            throw new InvalidInputException("sku", "PRODUCT_SKU_INVALID",
                    "SKU may only contain letters, digits, '.', '_', '/' and '-'.");
        }
        return sku;
    }

    private void requireNotDeleted() {
        if (deleted) {
            throw new BusinessRuleViolationException("PRODUCT_DELETED", "This product has been deleted.");
        }
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public String sku() { return sku; }
    public Barcode barcode() { return barcode; }
    public String name() { return name; }
    public String description() { return description; }
    public UUID categoryId() { return categoryId; }
    public UUID defaultSupplierId() { return defaultSupplierId; }
    public Unit unit() { return unit; }
    public Pricing pricing() { return pricing; }
    public StockPolicy stockPolicy() { return stockPolicy; }
    public Tracking tracking() { return tracking; }
    public boolean isActive() { return active; }
    public boolean isDeleted() { return deleted; }
    public long version() { return version; }

    public ProductDetails details() {
        return new ProductDetails(name, description, categoryId, defaultSupplierId, unit, pricing, stockPolicy);
    }
}
