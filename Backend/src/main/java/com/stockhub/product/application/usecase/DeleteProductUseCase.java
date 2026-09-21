package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.application.dto.ProductView;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.repository.ProductImageRepository;
import com.stockhub.product.domain.repository.ProductRepository;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Soft-deletes a product. A product that still holds stock can only be
 * deactivated: deleting it would hide quantities that physically exist.
 */
@Service
public class DeleteProductUseCase {

    private final ProductRepository products;
    private final ProductImageRepository images;
    private final ProductAccess access;
    private final AuditRecorder audit;

    DeleteProductUseCase(ProductRepository products, ProductImageRepository images, ProductAccess access,
                         AuditRecorder audit) {
        this.products = products;
        this.images = images;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public void execute(UUID productId) {
        Product product = access.load(productId);
        if (access.holdsStock(product.companyId(), productId)) {
            throw new BusinessRuleViolationException("PRODUCT_HAS_STOCK",
                    "A product that holds stock cannot be deleted; deactivate it instead.");
        }
        var before = ProductView.auditSnapshot(product);
        product.delete();
        products.save(product);
        images.delete(product.companyId(), productId);
        audit.record(AuditEntry.of("PRODUCT_DELETED", "Product", productId).change(before, null));
    }
}
