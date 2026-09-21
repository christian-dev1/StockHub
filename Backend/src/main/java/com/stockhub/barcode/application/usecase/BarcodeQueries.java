package com.stockhub.barcode.application.usecase;

import com.stockhub.barcode.application.port.BarcodeRenderer;
import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.product.ProductCatalog;
import com.stockhub.product.ProductSummary;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.security.CurrentUserProvider;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Renders the barcode of a product as an image. */
@Service
@Transactional(readOnly = true)
public class BarcodeQueries {

    private final ProductCatalog catalog;
    private final BarcodeRenderer renderer;
    private final CurrentUserProvider currentUser;

    BarcodeQueries(ProductCatalog catalog, BarcodeRenderer renderer, CurrentUserProvider currentUser) {
        this.catalog = catalog;
        this.renderer = renderer;
        this.currentUser = currentUser;
    }

    public byte[] png(UUID productId, int widthPx, int heightPx) {
        ProductSummary product = productWithBarcode(productId);
        return renderer.png(product.barcode(), Symbology.valueOf(product.barcodeFormat()), widthPx, heightPx);
    }

    public String svg(UUID productId, int heightPx) {
        ProductSummary product = productWithBarcode(productId);
        return renderer.svg(product.barcode(), Symbology.valueOf(product.barcodeFormat()), heightPx);
    }

    private ProductSummary productWithBarcode(UUID productId) {
        UUID companyId = currentUser.require().requireCompanyId();
        ProductSummary product = catalog.find(companyId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        if (product.barcode() == null) {
            throw new BusinessRuleViolationException("BARCODE_MISSING", "This product has no barcode yet.");
        }
        return product;
    }
}
