package com.stockhub.product.infrastructure.persistence;

import com.stockhub.product.domain.valueobject.BarcodeFormat;
import com.stockhub.product.domain.valueobject.Unit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
class ProductJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    String sku;
    String barcode;
    @Enumerated(EnumType.STRING)
    BarcodeFormat barcodeFormat;
    String name;
    String description;
    UUID categoryId;
    UUID defaultSupplierId;
    @Enumerated(EnumType.STRING)
    Unit unit;
    BigDecimal purchasePrice;
    BigDecimal salePrice;
    BigDecimal minStock;
    BigDecimal reorderQuantity;
    boolean batchTracked;
    boolean expiryTracked;
    boolean active;
    Instant deletedAt;
    @Column(insertable = false, updatable = false)
    Instant createdAt;
    @Column(insertable = false, updatable = false)
    Instant updatedAt;
    @Version
    long version;

    protected ProductJpaEntity() {
    }
}
