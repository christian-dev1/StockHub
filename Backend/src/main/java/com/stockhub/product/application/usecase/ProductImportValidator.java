package com.stockhub.product.application.usecase;

import static com.stockhub.product.application.usecase.ImportColumns.BARCODE;
import static com.stockhub.product.application.usecase.ImportColumns.BARCODE_FORMAT;
import static com.stockhub.product.application.usecase.ImportColumns.BATCH_TRACKED;
import static com.stockhub.product.application.usecase.ImportColumns.CATEGORY;
import static com.stockhub.product.application.usecase.ImportColumns.DESCRIPTION;
import static com.stockhub.product.application.usecase.ImportColumns.EXPIRY_TRACKED;
import static com.stockhub.product.application.usecase.ImportColumns.MIN_STOCK;
import static com.stockhub.product.application.usecase.ImportColumns.NAME;
import static com.stockhub.product.application.usecase.ImportColumns.PURCHASE_PRICE;
import static com.stockhub.product.application.usecase.ImportColumns.REORDER_QUANTITY;
import static com.stockhub.product.application.usecase.ImportColumns.SALE_PRICE;
import static com.stockhub.product.application.usecase.ImportColumns.SKU;
import static com.stockhub.product.application.usecase.ImportColumns.SUPPLIER_CODE;
import static com.stockhub.product.application.usecase.ImportColumns.UNIT;

import com.stockhub.product.application.command.ProductCommand;
import com.stockhub.product.application.dto.ImportIssue;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.product.domain.repository.ProductRepository;
import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.product.domain.valueobject.BarcodeFormat;
import com.stockhub.product.domain.valueobject.Unit;
import com.stockhub.shared.domain.exception.DomainException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.supplier.SupplierApi;
import com.stockhub.supplier.SupplierSummary;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Validates import rows against the domain rules and the current catalogue.
 * A row whose SKU exists updates that product (empty cells keep the current
 * value); any other row creates a product. Nothing is written here.
 */
@Component
class ProductImportValidator {

    /** Data starts on the second line of the file (the first one holds the headers). */
    private static final int FIRST_DATA_ROW = 2;

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final SupplierApi suppliers;
    private final ProductAccess access;

    ProductImportValidator(ProductRepository products, CategoryRepository categories, SupplierApi suppliers,
                           ProductAccess access) {
        this.products = products;
        this.categories = categories;
        this.suppliers = suppliers;
        this.access = access;
    }

    enum Action { CREATE, UPDATE, ERROR }

    /**
     * @param categoryToCreate name of a missing category that the row needs (only when creation is allowed)
     */
    record RowPlan(int rowNumber, Action action, ProductCommand command, UUID existingProductId,
                   String categoryToCreate, String sku, String name, List<ImportIssue> issues) {
    }

    record ImportPlan(List<RowPlan> rows) {

        long count(Action action) {
            return rows.stream().filter(r -> r.action() == action).count();
        }

        /** Distinct names (case-insensitive), in order of first appearance. */
        List<String> categoriesToCreate() {
            Map<String, String> byKey = new LinkedHashMap<>();
            rows.stream().filter(r -> r.action() != Action.ERROR).map(RowPlan::categoryToCreate)
                    .filter(Objects::nonNull)
                    .forEach(name -> byKey.putIfAbsent(name.toLowerCase(Locale.ROOT), name));
            return List.copyOf(byKey.values());
        }

        boolean hasErrors() {
            return count(Action.ERROR) > 0;
        }
    }

    ImportPlan validate(UUID companyId, List<Map<String, String>> rawRows, boolean createMissingCategories) {
        List<Map<String, String>> rows = rawRows.stream().map(ImportColumns::canonical).toList();
        Context context = new Context(companyId, createMissingCategories, rows);
        List<RowPlan> plans = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            plans.add(validateRow(context, FIRST_DATA_ROW + i, rows.get(i)));
        }
        return new ImportPlan(plans);
    }

    private RowPlan validateRow(Context ctx, int rowNumber, Map<String, String> row) {
        List<ImportIssue> issues = new ArrayList<>();
        String sku = row.get(SKU);
        Product existing = sku == null ? null : ctx.existingBySku.get(sku.toLowerCase(Locale.ROOT));
        if (sku != null && !ctx.seenSkus.add(sku.toLowerCase(Locale.ROOT))) {
            issues.add(new ImportIssue(SKU, "IMPORT_DUPLICATE_SKU", "This SKU appears several times in the file."));
        }
        ParsedValues values = parse(row, existing, issues);
        UUID categoryId = existing == null ? null : existing.categoryId();
        String categoryToCreate = null;
        if (row.containsKey(CATEGORY)) {
            Category category = ctx.categoriesByName.get(row.get(CATEGORY).toLowerCase(Locale.ROOT));
            if (category != null) {
                categoryId = category.id();
            } else if (ctx.createMissingCategories) {
                categoryToCreate = row.get(CATEGORY);
            } else {
                issues.add(new ImportIssue(CATEGORY, "IMPORT_CATEGORY_UNKNOWN", "Unknown category."));
            }
        }
        UUID supplierId = existing == null ? null : existing.defaultSupplierId();
        if (row.containsKey(SUPPLIER_CODE)) {
            Optional<SupplierSummary> supplier = ctx.supplier(row.get(SUPPLIER_CODE));
            if (supplier.isPresent() && supplier.get().active()) {
                supplierId = supplier.get().id();
            } else {
                issues.add(new ImportIssue(SUPPLIER_CODE, "IMPORT_SUPPLIER_UNKNOWN", "Unknown or inactive supplier."));
            }
        }
        ProductCommand command = new ProductCommand(sku, values.barcode, values.barcodeFormat,
                values.name, values.description, categoryId, supplierId, values.unit, values.purchasePrice,
                values.salePrice, values.minStock, values.reorderQuantity, values.batchTracked, values.expiryTracked);
        checkBarcode(ctx, command, existing, issues);
        checkDomainRules(ctx.companyId, command, existing, issues);
        Action action = !issues.isEmpty() ? Action.ERROR : existing == null ? Action.CREATE : Action.UPDATE;
        return new RowPlan(rowNumber, action, command, existing == null ? null : existing.id(), categoryToCreate,
                sku, values.name, List.copyOf(issues));
    }

    /** Parsed cell values, falling back to the existing product for empty cells. */
    private static final class ParsedValues {
        String name;
        String description;
        Unit unit;
        BigDecimal purchasePrice;
        BigDecimal salePrice;
        BigDecimal minStock;
        BigDecimal reorderQuantity;
        String barcode;
        BarcodeFormat barcodeFormat;
        boolean batchTracked;
        boolean expiryTracked;
    }

    private static ParsedValues parse(Map<String, String> row, Product existing, List<ImportIssue> issues) {
        ParsedValues v = new ParsedValues();
        v.name = row.getOrDefault(NAME, existing == null ? null : existing.name());
        v.description = row.getOrDefault(DESCRIPTION, existing == null ? null : existing.description());
        v.unit = parseOr(row, UNIT, ImportColumns::unit, existing == null ? Unit.UNIT : existing.unit(), issues);
        v.purchasePrice = decimalOr(row, PURCHASE_PRICE,
                existing == null ? null : existing.pricing().purchasePrice(), issues);
        v.salePrice = decimalOr(row, SALE_PRICE, existing == null ? null : existing.pricing().salePrice(), issues);
        v.minStock = decimalOr(row, MIN_STOCK, existing == null ? null : existing.stockPolicy().minStock(), issues);
        v.reorderQuantity = decimalOr(row, REORDER_QUANTITY,
                existing == null ? null : existing.stockPolicy().reorderQuantity(), issues);
        Barcode current = existing == null ? null : existing.barcode();
        v.barcode = row.getOrDefault(BARCODE, current == null ? null : current.value());
        v.barcodeFormat = row.containsKey(BARCODE)
                ? parseOr(row, BARCODE_FORMAT, ProductImportValidator::barcodeFormat, null, issues)
                : current == null ? null : current.format();
        v.batchTracked = parseOr(row, BATCH_TRACKED, ImportColumns::bool,
                existing != null && existing.tracking().batchTracked(), issues);
        v.expiryTracked = parseOr(row, EXPIRY_TRACKED, ImportColumns::bool,
                existing != null && existing.tracking().expiryTracked(), issues);
        return v;
    }

    private static <T> T parseOr(Map<String, String> row, String column, Function<String, T> parser, T fallback,
                                 List<ImportIssue> issues) {
        if (!row.containsKey(column)) {
            return fallback;
        }
        try {
            return parser.apply(row.get(column));
        } catch (IllegalArgumentException e) {
            issues.add(new ImportIssue(column, "IMPORT_VALUE_INVALID", "Invalid value: " + row.get(column)));
            return fallback;
        }
    }

    private static BigDecimal decimalOr(Map<String, String> row, String column, BigDecimal fallback,
                                        List<ImportIssue> issues) {
        return parseOr(row, column, value -> ImportColumns.decimal(value).orElse(null), fallback, issues);
    }

    private static BarcodeFormat barcodeFormat(String value) {
        return switch (ImportColumns.normalize(value)) {
            case "code128" -> BarcodeFormat.CODE128;
            case "ean13" -> BarcodeFormat.EAN13;
            case "ean8" -> BarcodeFormat.EAN8;
            case "upca", "upc" -> BarcodeFormat.UPC_A;
            default -> throw new IllegalArgumentException(value);
        };
    }

    private static void checkBarcode(Context ctx, ProductCommand command, Product existing, List<ImportIssue> issues) {
        String barcode = command.barcode();
        if (barcode == null) {
            return;
        }
        if (!ctx.seenBarcodes.add(barcode)) {
            issues.add(new ImportIssue(BARCODE, "IMPORT_DUPLICATE_BARCODE",
                    "This barcode appears several times in the file."));
        }
        UUID owner = ctx.productIdByBarcode.get(barcode);
        if (owner != null && (existing == null || !owner.equals(existing.id()))) {
            issues.add(new ImportIssue(BARCODE, "PRODUCT_BARCODE_ALREADY_EXISTS",
                    "Another product already uses this barcode."));
        }
    }

    /**
     * Runs the domain validation on a throw-away instance. Each value object is
     * checked separately so that every problem of the row is reported at once.
     */
    private void checkDomainRules(UUID companyId, ProductCommand command, Product existing, List<ImportIssue> issues) {
        int before = issues.size();
        var barcode = capture(command::barcodeValue, issues);
        var details = capture(command::details, issues);
        var tracking = capture(command::tracking, issues);
        if (issues.size() > before) {
            return;
        }
        String sku = command.sku() == null ? "IMPORT-PREVIEW" : command.sku();
        capture(() -> Product.create(companyId, sku, barcode, details, tracking), issues);
        if (existing != null && existing.changesTracking(tracking) && access.holdsStock(companyId, existing.id())) {
            issues.add(new ImportIssue(BATCH_TRACKED, "PRODUCT_TRACKING_LOCKED",
                    "Batch tracking cannot change while the product holds stock."));
        }
    }

    private static <T> T capture(java.util.function.Supplier<T> validation, List<ImportIssue> issues) {
        try {
            return validation.get();
        } catch (InvalidInputException e) {
            issues.add(new ImportIssue(e.field(), e.code(), e.getMessage()));
        } catch (DomainException e) {
            issues.add(new ImportIssue(null, e.code(), e.getMessage()));
        }
        return null;
    }

    /** Catalogue data loaded once per validation, with per-file duplicate tracking. */
    private final class Context {
        final UUID companyId;
        final boolean createMissingCategories;
        final Map<String, Product> existingBySku;
        final Map<String, UUID> productIdByBarcode;
        final Map<String, Category> categoriesByName;
        final Map<String, Optional<SupplierSummary>> suppliersByCode = new HashMap<>();
        final Set<String> seenSkus = new HashSet<>();
        final Set<String> seenBarcodes = new HashSet<>();

        Context(UUID companyId, boolean createMissingCategories, List<Map<String, String>> rows) {
            this.companyId = companyId;
            this.createMissingCategories = createMissingCategories;
            this.existingBySku = products.findBySkus(companyId, values(rows, SKU));
            this.productIdByBarcode = products.findIdsByBarcodes(companyId, values(rows, BARCODE));
            this.categoriesByName = categories.findAll(companyId).stream()
                    .collect(Collectors.toMap(c -> c.name().toLowerCase(Locale.ROOT), Function.identity(), (a, b) -> a));
        }

        Optional<SupplierSummary> supplier(String code) {
            return suppliersByCode.computeIfAbsent(code.toLowerCase(Locale.ROOT),
                    key -> suppliers.findByCode(companyId, code));
        }

        private static Set<String> values(List<Map<String, String>> rows, String column) {
            return rows.stream().map(r -> r.get(column)).filter(Objects::nonNull).collect(Collectors.toSet());
        }
    }
}
