package com.stockhub.product.application.usecase;

import com.stockhub.product.application.dto.ProductView;
import com.stockhub.product.domain.model.Category;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.repository.CategoryRepository;
import com.stockhub.product.domain.repository.ProductImageRepository;
import com.stockhub.supplier.SupplierApi;
import com.stockhub.supplier.SupplierSummary;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Builds product views with category / supplier names and image flags using one query per kind. */
@Component
class ProductViewAssembler {

    private final CategoryRepository categories;
    private final SupplierApi suppliers;
    private final ProductImageRepository images;

    ProductViewAssembler(CategoryRepository categories, SupplierApi suppliers, ProductImageRepository images) {
        this.categories = categories;
        this.suppliers = suppliers;
        this.images = images;
    }

    ProductView toView(Product product) {
        return toViews(product.companyId(), List.of(product)).getFirst();
    }

    List<ProductView> toViews(UUID companyId, List<Product> products) {
        if (products.isEmpty()) {
            return List.of();
        }
        Set<UUID> categoryIds = ids(products, Product::categoryId);
        Map<UUID, String> categoryNames = categoryIds.isEmpty() ? Map.of()
                : categories.findByIds(companyId, categoryIds).stream()
                        .collect(Collectors.toMap(Category::id, Category::name));
        Map<UUID, SupplierSummary> supplierById = suppliers.findByIds(companyId, ids(products, Product::defaultSupplierId));
        Set<UUID> withImage = images.withImage(companyId, products.stream().map(Product::id).toList());
        return products.stream()
                .map(p -> ProductView.from(p, p.categoryId() == null ? null : categoryNames.get(p.categoryId()),
                        supplierName(supplierById, p.defaultSupplierId()), withImage.contains(p.id())))
                .toList();
    }

    private static String supplierName(Map<UUID, SupplierSummary> supplierById, UUID supplierId) {
        SupplierSummary supplier = supplierId == null ? null : supplierById.get(supplierId);
        return supplier == null ? null : supplier.name();
    }

    private static Set<UUID> ids(List<Product> products, Function<Product, UUID> extractor) {
        return products.stream().map(extractor).filter(Objects::nonNull).collect(Collectors.toSet());
    }
}
