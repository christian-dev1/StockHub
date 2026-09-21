package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.domain.exception.ProductErrors;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.model.ProductImage;
import com.stockhub.product.domain.repository.ProductImageRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductImageUseCase {

    private final ProductImageRepository images;
    private final ProductAccess access;
    private final AuditRecorder audit;

    ProductImageUseCase(ProductImageRepository images, ProductAccess access, AuditRecorder audit) {
        this.images = images;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public void upload(UUID productId, byte[] data) {
        Product product = access.load(productId);
        ProductImage image = ProductImage.of(product.id(), product.companyId(), data);
        images.save(image);
        audit.record(AuditEntry.of("PRODUCT_IMAGE_UPDATED", "Product", productId)
                .withMetadata(Map.of("contentType", image.contentType(), "sizeBytes", data.length)));
    }

    @Transactional
    public void remove(UUID productId) {
        Product product = access.load(productId);
        images.delete(product.companyId(), productId);
        audit.record(AuditEntry.of("PRODUCT_IMAGE_REMOVED", "Product", productId));
    }

    @Transactional(readOnly = true)
    public ProductImage get(UUID productId) {
        Product product = access.load(productId);
        return images.find(product.companyId(), productId).orElseThrow(() -> ProductErrors.notFound(productId));
    }
}
