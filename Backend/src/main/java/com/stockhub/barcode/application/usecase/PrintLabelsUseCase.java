package com.stockhub.barcode.application.usecase;

import com.stockhub.barcode.application.command.LabelRequestItem;
import com.stockhub.barcode.application.command.PrintLabelsCommand;
import com.stockhub.barcode.application.port.LabelSheetRenderer;
import com.stockhub.barcode.domain.model.Label;
import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.company.CompanyApi;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.product.ProductCatalog;
import com.stockhub.product.ProductSummary;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.security.CurrentUserProvider;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Currency;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Builds a printable PDF sheet of product labels (name, barcode, SKU and optionally price). */
@Service
public class PrintLabelsUseCase {

    public static final int MAX_LABELS = 1000;

    private final ProductCatalog catalog;
    private final CompanyApi companies;
    private final LabelSheetRenderer renderer;
    private final CurrentUserProvider currentUser;

    PrintLabelsUseCase(ProductCatalog catalog, CompanyApi companies, LabelSheetRenderer renderer,
                       CurrentUserProvider currentUser) {
        this.catalog = catalog;
        this.companies = companies;
        this.renderer = renderer;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public byte[] execute(PrintLabelsCommand command) {
        UUID companyId = currentUser.require().requireCompanyId();
        int total = command.items().stream().mapToInt(LabelRequestItem::copies).sum();
        if (total < 1 || total > MAX_LABELS) {
            throw new InvalidInputException("items", "LABELS_COUNT_INVALID", "Between 1 and %d labels per sheet run.",
                    MAX_LABELS);
        }
        if (command.startPosition() < 0 || command.startPosition() >= command.layout().perPage()) {
            throw new InvalidInputException("startPosition", "LABELS_START_INVALID", "Invalid start position.");
        }
        Map<UUID, ProductSummary> products = catalog.findByIds(companyId,
                command.items().stream().map(LabelRequestItem::productId).toList());
        NumberFormat money = command.showPrice() ? moneyFormat(companyId) : null;
        List<Label> labels = new ArrayList<>(total);
        for (LabelRequestItem item : command.items()) {
            ProductSummary product = products.get(item.productId());
            if (product == null) {
                throw new InvalidInputException("items", "PRODUCT_NOT_FOUND", "Unknown product %s.", item.productId());
            }
            if (product.barcode() == null) {
                throw new BusinessRuleViolationException("BARCODE_MISSING",
                        "Product %s has no barcode yet.", product.sku());
            }
            Label label = new Label(product.name(), product.sku(), product.barcode(),
                    Symbology.valueOf(product.barcodeFormat()), money == null ? null : format(money, product.salePrice()));
            for (int i = 0; i < item.copies(); i++) {
                labels.add(label);
            }
        }
        return renderer.pdf(labels, command.layout(), command.startPosition());
    }

    private NumberFormat moneyFormat(UUID companyId) {
        CompanySnapshot company = companies.find(companyId).orElseThrow();
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag(company.locale()));
        format.setCurrency(Currency.getInstance(company.currency()));
        return format;
    }

    /** PDF standard fonts cannot draw narrow no-break spaces used by some locales. */
    private static String format(NumberFormat money, BigDecimal amount) {
        return money.format(amount).replace(' ', ' ').replace(' ', ' ');
    }
}
