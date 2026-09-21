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

/**
 * Updates a product. A blank SKU keeps the current one; a blank barcode removes
 * it. Switching batch tracking is refused while the product holds stock.
 */
@Service
public class UpdateProductUseCase {

    private final ProductRepository products;
    private final ProductAccess access;
    private final ProductViewAssembler assembler;
    private final AuditRecorder audit;

    UpdateProductUseCase(ProductRepository products, ProductAccess access, ProductViewAssembler assembler,
                         AuditRecorder audit) {
        this.products = products;
        this.access = access;
        this.assembler = assembler;
        this.audit = audit;
    }

    @Transactional
    public ProductView execute(UUID productId, ProductCommand command, long version) {
        Product product = access.load(productId, version);
        var before = ProductView.auditSnapshot(product);
        apply(product, command);
        audit.record(AuditEntry.of("PRODUCT_UPDATED", "Product", productId)
                .change(before, ProductView.auditSnapshot(product)));
        return assembler.toView(product);
    }

    /** Validates and persists the changes without auditing (shared with the bulk import). */
    void apply(Product product, ProductCommand command) {
        UUID companyId = product.companyId();
        String sku = command.sku() == null || command.sku().isBlank() ? product.sku() : command.sku();
        UUID previousSupplier = product.defaultSupplierId();
        product.update(sku, command.details());
        access.requireUniqueSku(companyId, product.sku(), product.id());
        access.requireValidReferences(companyId, command.details(), previousSupplier);
        Barcode barcode = command.barcodeValue();
        if (barcode == null) {
            product.removeBarcode();
        } else {
            access.requireUniqueBarcode(companyId, barcode, product.id());
            product.assignBarcode(barcode);
        }
        boolean holdsStock = product.changesTracking(command.tracking()) && access.holdsStock(companyId, product.id());
        product.changeTracking(command.tracking(), holdsStock);
        products.save(product);
    }
}
