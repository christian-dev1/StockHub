package com.stockhub.product.domain.repository;

import com.stockhub.product.domain.model.Product;
import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.domain.page.PageResult;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Deleted products are invisible to every query. */
public interface ProductRepository {

    void save(Product product);

    Optional<Product> findById(UUID companyId, UUID id);

    List<Product> findByIds(UUID companyId, Collection<UUID> ids);

    Optional<Product> findBySku(UUID companyId, String sku);

    Map<String, Product> findBySkus(UUID companyId, Collection<String> skus);

    Optional<Product> findByBarcode(UUID companyId, String barcode);

    /** Barcode → product id, for the given barcodes that are in use. */
    Map<String, UUID> findIdsByBarcodes(UUID companyId, Collection<String> barcodes);

    boolean existsBySku(UUID companyId, String sku, UUID excludedId);

    boolean existsByBarcode(UUID companyId, String barcode, UUID excludedId);

    long countByCategory(UUID companyId, UUID categoryId);

    Map<UUID, Long> countByCategories(UUID companyId);

    PageResult<Product> search(UUID companyId, ProductSearchCriteria criteria, PageQuery page);
}
