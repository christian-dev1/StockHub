package com.stockhub.barcode.application.usecase;

import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.barcode.domain.service.BarcodeValueGenerator;
import com.stockhub.product.ProductCatalog;
import com.stockhub.product.ProductSummary;
import com.stockhub.shared.application.SequenceGenerator;
import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.security.CurrentUserProvider;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generates a unique barcode for a product and assigns it. An existing barcode
 * is only replaced when explicitly requested (labels may already be printed).
 */
@Service
public class GenerateBarcodeUseCase {

    private final ProductCatalog catalog;
    private final SequenceGenerator sequences;
    private final CurrentUserProvider currentUser;

    GenerateBarcodeUseCase(ProductCatalog catalog, SequenceGenerator sequences, CurrentUserProvider currentUser) {
        this.catalog = catalog;
        this.sequences = sequences;
        this.currentUser = currentUser;
    }

    @Transactional
    public ProductSummary execute(UUID productId, Symbology symbology, boolean replaceExisting) {
        if (!symbology.isGeneratable()) {
            throw new InvalidInputException("format", "BARCODE_FORMAT_NOT_GENERATABLE",
                    "Only CODE128 and EAN-13 barcodes can be generated.");
        }
        UUID companyId = currentUser.require().requireCompanyId();
        ProductSummary product = catalog.find(companyId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        if (product.barcode() != null && !replaceExisting) {
            throw new ConflictException("BARCODE_ALREADY_ASSIGNED", "This product already has a barcode.");
        }
        String value;
        do {
            value = BarcodeValueGenerator.generate(symbology, sequences.next(companyId, "BARCODE_" + symbology.name()));
        } while (catalog.barcodeExists(companyId, value));
        return catalog.assignBarcode(companyId, productId, value, symbology.name());
    }
}
