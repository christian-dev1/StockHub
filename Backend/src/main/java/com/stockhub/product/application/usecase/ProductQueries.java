package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.ProductCatalog;
import com.stockhub.product.ProductSummary;
import com.stockhub.product.application.dto.ProductView;
import com.stockhub.product.application.query.ProductSearchQuery;
import com.stockhub.product.domain.exception.ProductErrors;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.repository.ProductRepository;
import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.product.domain.valueobject.BarcodeFormat;
import com.stockhub.shared.domain.page.PageResult;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductQueries implements ProductCatalog {

    private final ProductRepository products;
    private final ProductAccess access;
    private final ProductViewAssembler assembler;
    private final AuditRecorder audit;

    ProductQueries(ProductRepository products, ProductAccess access, ProductViewAssembler assembler,
                   AuditRecorder audit) {
        this.products = products;
        this.access = access;
        this.assembler = assembler;
        this.audit = audit;
    }

    public PageResult<ProductView> search(ProductSearchQuery query) {
        UUID companyId = access.companyId();
        PageResult<Product> page = products.search(companyId, query.criteria(), query.page());
        return new PageResult<>(assembler.toViews(companyId, page.content()), page.page(), page.size(),
                page.totalElements());
    }

    public ProductView get(UUID productId) {
        return assembler.toView(access.load(productId));
    }

    /** Scan lookup: exact barcode first, then SKU. */
    public ProductView lookup(String code) {
        UUID companyId = access.companyId();
        return findProductByCode(companyId, code).map(assembler::toView)
                .orElseThrow(() -> ProductErrors.notFound(code == null ? "" : code.strip()));
    }

    @Override
    public Optional<ProductSummary> find(UUID companyId, UUID productId) {
        return products.findById(companyId, productId).map(ProductQueries::toSummary);
    }

    @Override
    public Map<UUID, ProductSummary> findByIds(UUID companyId, Collection<UUID> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        return products.findByIds(companyId, productIds).stream().map(ProductQueries::toSummary)
                .collect(Collectors.toUnmodifiableMap(ProductSummary::id, Function.identity()));
    }

    @Override
    public Optional<ProductSummary> findByCode(UUID companyId, String code) {
        return findProductByCode(companyId, code).map(ProductQueries::toSummary);
    }

    @Override
    public boolean barcodeExists(UUID companyId, String barcode) {
        return products.existsByBarcode(companyId, barcode, null);
    }

    @Override
    @Transactional
    public ProductSummary assignBarcode(UUID companyId, UUID productId, String value, String format) {
        Product product = products.findById(companyId, productId).orElseThrow(() -> ProductErrors.notFound(productId));
        Barcode barcode = new Barcode(value, BarcodeFormat.valueOf(format));
        access.requireUniqueBarcode(companyId, barcode, productId);
        String previous = product.barcode() == null ? null : product.barcode().value();
        product.assignBarcode(barcode);
        products.save(product);
        audit.record(AuditEntry.of("PRODUCT_BARCODE_ASSIGNED", "Product", productId).inCompany(companyId)
                .change(previous == null ? null : Map.of("barcode", previous),
                        Map.of("barcode", barcode.value(), "format", barcode.format().name())));
        return toSummary(product);
    }

    private Optional<Product> findProductByCode(UUID companyId, String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        String trimmed = code.strip();
        return products.findByBarcode(companyId, trimmed).or(() -> products.findBySku(companyId, trimmed));
    }

    static ProductSummary toSummary(Product p) {
        return new ProductSummary(p.id(), p.sku(), p.barcode() == null ? null : p.barcode().value(),
                p.barcode() == null ? null : p.barcode().format().name(), p.name(), p.unit().name(), p.categoryId(),
                p.defaultSupplierId(), p.pricing().purchasePrice(), p.pricing().salePrice(),
                p.stockPolicy().minStock(), p.stockPolicy().reorderQuantity(), p.tracking().batchTracked(),
                p.tracking().expiryTracked(), p.isActive());
    }
}
