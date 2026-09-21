package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.model.ProductDetails;
import com.stockhub.product.domain.repository.ProductRepository;
import com.stockhub.product.domain.repository.ProductSearchCriteria;
import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.product.domain.valueobject.Pricing;
import com.stockhub.product.domain.valueobject.StockPolicy;
import com.stockhub.product.domain.valueobject.Tracking;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

@Repository
class JpaProductRepository implements ProductRepository {

    private static final Map<String, String> SORTABLE = Map.of("name", "name", "sku", "sku",
            "salePrice", "salePrice", "purchasePrice", "purchasePrice", "minStock", "minStock",
            "createdAt", "createdAt", "updatedAt", "updatedAt");

    private final ProductJpaRepository jpa;

    JpaProductRepository(ProductJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(Product product) {
        ProductJpaEntity e = jpa.findById(product.id()).orElse(null);
        if (e == null) {
            e = new ProductJpaEntity();
            e.id = product.id();
            e.companyId = product.companyId();
        } else if (e.version != product.version() || !e.companyId.equals(product.companyId())) {
            throw new ObjectOptimisticLockingFailureException(ProductJpaEntity.class, product.id());
        }
        e.sku = product.sku();
        e.barcode = product.barcode() == null ? null : product.barcode().value();
        e.barcodeFormat = product.barcode() == null ? null : product.barcode().format();
        e.name = product.name();
        e.description = product.description();
        e.categoryId = product.categoryId();
        e.defaultSupplierId = product.defaultSupplierId();
        e.unit = product.unit();
        e.purchasePrice = product.pricing().purchasePrice();
        e.salePrice = product.pricing().salePrice();
        e.minStock = product.stockPolicy().minStock();
        e.reorderQuantity = product.stockPolicy().reorderQuantity();
        e.batchTracked = product.tracking().batchTracked();
        e.expiryTracked = product.tracking().expiryTracked();
        e.active = product.isActive();
        if (product.isDeleted() && e.deletedAt == null) {
            e.deletedAt = Instant.now();
        }
        jpa.saveAndFlush(e);
    }

    @Override
    public Optional<Product> findById(UUID companyId, UUID id) {
        return jpa.findByIdAndCompanyIdAndDeletedAtIsNull(id, companyId).map(JpaProductRepository::toDomain);
    }

    @Override
    public List<Product> findByIds(UUID companyId, Collection<UUID> ids) {
        return jpa.findByCompanyIdAndIdInAndDeletedAtIsNull(companyId, ids).stream()
                .map(JpaProductRepository::toDomain).toList();
    }

    @Override
    public Optional<Product> findBySku(UUID companyId, String sku) {
        return jpa.findBySku(companyId, sku.strip()).map(JpaProductRepository::toDomain);
    }

    @Override
    public Map<String, Product> findBySkus(UUID companyId, Collection<String> skus) {
        if (skus.isEmpty()) {
            return Map.of();
        }
        List<String> lower = skus.stream().map(s -> s.strip().toLowerCase(Locale.ROOT)).distinct().toList();
        return jpa.findBySkus(companyId, lower).stream().map(JpaProductRepository::toDomain)
                .collect(Collectors.toMap(p -> p.sku().toLowerCase(Locale.ROOT), Function.identity()));
    }

    @Override
    public Optional<Product> findByBarcode(UUID companyId, String barcode) {
        return jpa.findByCompanyIdAndBarcodeAndDeletedAtIsNull(companyId, barcode.strip())
                .map(JpaProductRepository::toDomain);
    }

    @Override
    public Map<String, UUID> findIdsByBarcodes(UUID companyId, Collection<String> barcodes) {
        if (barcodes.isEmpty()) {
            return Map.of();
        }
        return jpa.findIdsByBarcodes(companyId, barcodes).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (UUID) row[1]));
    }

    @Override
    public boolean existsBySku(UUID companyId, String sku, UUID excludedId) {
        return jpa.existsBySku(companyId, sku, excludedId);
    }

    @Override
    public boolean existsByBarcode(UUID companyId, String barcode, UUID excludedId) {
        return jpa.existsByBarcode(companyId, barcode, excludedId);
    }

    @Override
    public long countByCategory(UUID companyId, UUID categoryId) {
        return jpa.countByCompanyIdAndCategoryIdAndDeletedAtIsNull(companyId, categoryId);
    }

    @Override
    public Map<UUID, Long> countByCategories(UUID companyId) {
        return jpa.countByCategories(companyId).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
    }

    @Override
    public PageResult<Product> search(UUID companyId, ProductSearchCriteria criteria, PageQuery page) {
        Sort sort = Sort.by(page.ascending() ? Sort.Direction.ASC : Sort.Direction.DESC,
                SORTABLE.getOrDefault(page.sortField(), "name")).and(Sort.by("id"));
        var result = jpa.findAll(ProductSpecifications.matching(companyId, criteria),
                PageRequest.of(page.page(), page.size(), sort));
        return new PageResult<>(result.map(JpaProductRepository::toDomain).getContent(), page.page(), page.size(),
                result.getTotalElements());
    }

    static Product toDomain(ProductJpaEntity e) {
        Barcode barcode = e.barcode == null ? null : new Barcode(e.barcode, e.barcodeFormat);
        ProductDetails details = new ProductDetails(e.name, e.description, e.categoryId, e.defaultSupplierId, e.unit,
                new Pricing(e.purchasePrice, e.salePrice), new StockPolicy(e.minStock, e.reorderQuantity));
        return new Product(e.id, e.companyId, e.sku, barcode, details, new Tracking(e.batchTracked, e.expiryTracked),
                e.active, e.deletedAt != null, e.version);
    }
}
