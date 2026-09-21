package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.model.ProductImage;
import com.stockhub.product.domain.repository.ProductImageRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
class JpaProductImageRepository implements ProductImageRepository {

    private final ProductImageJpaRepository jpa;

    JpaProductImageRepository(ProductImageJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(ProductImage image) {
        ProductImageJpaEntity e = jpa.findByProductIdAndCompanyId(image.productId(), image.companyId())
                .orElseGet(ProductImageJpaEntity::new);
        e.productId = image.productId();
        e.companyId = image.companyId();
        e.contentType = image.contentType();
        e.sizeBytes = image.data().length;
        e.data = image.data();
        e.updatedAt = Instant.now();
        jpa.saveAndFlush(e);
    }

    @Override
    public Optional<ProductImage> find(UUID companyId, UUID productId) {
        return jpa.findByProductIdAndCompanyId(productId, companyId)
                .map(e -> new ProductImage(e.productId, e.companyId, e.contentType, e.data));
    }

    @Override
    public void delete(UUID companyId, UUID productId) {
        jpa.deleteImage(productId, companyId);
    }

    @Override
    public Set<UUID> withImage(UUID companyId, Collection<UUID> productIds) {
        return productIds.isEmpty() ? Set.of() : Set.copyOf(jpa.findProductIdsWithImage(companyId, productIds));
    }
}
