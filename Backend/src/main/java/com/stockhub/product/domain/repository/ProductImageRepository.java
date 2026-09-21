package com.stockhub.product.domain.repository;

import com.stockhub.product.domain.model.ProductImage;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ProductImageRepository {

    void save(ProductImage image);

    Optional<ProductImage> find(UUID companyId, UUID productId);

    void delete(UUID companyId, UUID productId);

    /** Ids among the given products that have an image. */
    Set<UUID> withImage(UUID companyId, Collection<UUID> productIds);
}
