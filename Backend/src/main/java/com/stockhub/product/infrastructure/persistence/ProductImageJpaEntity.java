package com.stockhub.product.infrastructure.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "product_images")
class ProductImageJpaEntity {

    @Id
    UUID productId;
    UUID companyId;
    String contentType;
    int sizeBytes;
    byte[] data;
    Instant updatedAt;

    protected ProductImageJpaEntity() {
    }
}
