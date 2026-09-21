package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.application.dto.ProductView;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.repository.ProductRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** An inactive product stays in history and stock but cannot be sold or ordered. */
@Service
public class ChangeProductStatusUseCase {

    private final ProductRepository products;
    private final ProductAccess access;
    private final ProductViewAssembler assembler;
    private final AuditRecorder audit;

    ChangeProductStatusUseCase(ProductRepository products, ProductAccess access, ProductViewAssembler assembler,
                               AuditRecorder audit) {
        this.products = products;
        this.access = access;
        this.assembler = assembler;
        this.audit = audit;
    }

    @Transactional
    public ProductView deactivate(UUID productId) {
        Product product = access.load(productId);
        product.deactivate();
        return persist(product, "PRODUCT_DISABLED");
    }

    @Transactional
    public ProductView activate(UUID productId) {
        Product product = access.load(productId);
        product.activate();
        return persist(product, "PRODUCT_ENABLED");
    }

    private ProductView persist(Product product, String action) {
        products.save(product);
        audit.record(AuditEntry.of(action, "Product", product.id()));
        return assembler.toView(product);
    }
}
