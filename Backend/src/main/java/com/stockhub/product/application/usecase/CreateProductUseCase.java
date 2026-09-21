package com.stockhub.product.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.product.application.command.ProductCommand;
import com.stockhub.product.application.dto.ProductView;
import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.repository.ProductRepository;
import com.stockhub.product.domain.valueobject.Barcode;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateProductUseCase {

    private final ProductRepository products;
    private final ProductAccess access;
    private final ProductViewAssembler assembler;
    private final AuditRecorder audit;

    CreateProductUseCase(ProductRepository products, ProductAccess access, ProductViewAssembler assembler,
                         AuditRecorder audit) {
        this.products = products;
        this.access = access;
        this.assembler = assembler;
        this.audit = audit;
    }

    @Transactional
    public ProductView execute(ProductCommand command) {
        UUID companyId = access.companyId();
        Product product = create(companyId, command);
        audit.record(AuditEntry.of("PRODUCT_CREATED", "Product", product.id())
                .change(null, ProductView.auditSnapshot(product)));
        return assembler.toView(product);
    }

    /** Validates and persists a product without auditing (shared with the bulk import). */
    Product create(UUID companyId, ProductCommand command) {
        boolean generated = command.sku() == null || command.sku().isBlank();
        String sku = generated ? access.nextSku(companyId) : command.sku();
        Barcode barcode = command.barcodeValue();
        Product product = Product.create(companyId, sku, barcode, command.details(), command.tracking());
        if (!generated) {
            access.requireUniqueSku(companyId, product.sku(), null);
        }
        access.requireUniqueBarcode(companyId, barcode, null);
        access.requireValidReferences(companyId, command.details(), null);
        products.save(product);
        return product;
    }
}
