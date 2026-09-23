package com.stockhub.sale.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.product.ProductCatalog;
import com.stockhub.product.ProductSummary;
import com.stockhub.sale.application.command.CreateSaleCommand;
import com.stockhub.sale.application.dto.SaleView;
import com.stockhub.sale.application.port.SaleReadModel;
import com.stockhub.sale.domain.exception.SaleErrors;
import com.stockhub.sale.domain.model.Cart;
import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.Sale;
import com.stockhub.sale.domain.model.SaleLine;
import com.stockhub.sale.domain.repository.SaleRepository;
import com.stockhub.shared.application.SequenceGenerator;
import com.stockhub.shared.domain.Texts;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.stock.StockSalePort;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Records a point-of-sale sale in one transaction: prices read from the catalogue, stock issued
 * under lock by the stock engine (SALE movements), sale stored, audit written.
 */
@Service
public class SaleUseCases {
    private static final String NUMBER_PREFIX = "VT";
    private static final String SEQUENCE = "SALE";
    private static final Pattern IDEMPOTENCY_KEY = Pattern.compile("[A-Za-z0-9_-]{8,80}");

    private final SaleAccess access;
    private final ProductCatalog products;
    private final StockSalePort stock;
    private final SequenceGenerator sequences;
    private final SaleRepository sales;
    private final SaleReadModel reads;
    private final AuditRecorder audit;
    private final Clock clock;

    SaleUseCases(
            SaleAccess access,
            ProductCatalog products,
            StockSalePort stock,
            SequenceGenerator sequences,
            SaleRepository sales,
            SaleReadModel reads,
            AuditRecorder audit,
            Clock clock) {
        this.access = access;
        this.products = products;
        this.stock = stock;
        this.sequences = sequences;
        this.sales = sales;
        this.reads = reads;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public SaleView create(CreateSaleCommand command) {
        CurrentUser user = access.user();
        UUID companyId = user.requireCompanyId();

        String key = idempotencyKey(command.idempotencyKey());
        if (key != null) {
            var recorded = sales.findByIdempotencyKey(companyId, key);
            if (recorded.isPresent()) {
                if (!recorded.get().sellerId().equals(user.userId())) {
                    throw SaleErrors.idempotencyKeyReused();
                }
                return reads.find(companyId, recorded.get().id()).orElseThrow();
            }
        }

        if (command.locationId() == null) {
            throw new InvalidInputException("locationId", "LOCATION_REQUIRED", "A location is required.");
        }
        PaymentMethod payment = paymentMethod(command.paymentMethod());
        String customerName = Texts.optional(command.customerName(), "customerName", Sale.CUSTOMER_NAME_MAX);
        Cart cart =
                new Cart(
                        command.lines() == null
                                ? null
                                : command.lines().stream()
                                        .map(l -> l == null ? null : new Cart.Item(l.productId(), l.quantity()))
                                        .toList());

        List<SaleLine> lines = price(companyId, cart);

        CompanySnapshot company = access.company();
        int year = access.today(company).getYear();
        String number =
                SequenceGenerator.documentNumber(
                        NUMBER_PREFIX, year, sequences.next(companyId, SEQUENCE, year));
        var issued =
                stock.issue(
                        command.locationId(),
                        number,
                        cart.items().stream()
                                .map(i -> new StockSalePort.Line(i.productId(), i.quantity()))
                                .toList());

        Sale sale =
                Sale.complete(
                        companyId,
                        command.locationId(),
                        number,
                        user.userId(),
                        issued.performedByName(),
                        customerName,
                        payment,
                        company.currency(),
                        issued.documentId(),
                        key,
                        clock.instant(),
                        lines);
        sales.add(sale);
        audit.record(
                AuditEntry.of("SALE_CREATED", "Sale", sale.id())
                        .inCompany(companyId)
                        .withMetadata(
                                Map.of(
                                        "number", number,
                                        "location", command.locationId(),
                                        "total", sale.totalAmount(),
                                        "lines", lines.size(),
                                        "stockDocument", issued.documentNumber())));
        return reads.find(companyId, sale.id()).orElseThrow();
    }

    /** Prices come from the catalogue only; inactive or unknown products cannot be sold. */
    private List<SaleLine> price(UUID companyId, Cart cart) {
        Map<UUID, ProductSummary> catalogue = products.findByIds(companyId, cart.productIds());
        List<SaleLine> lines = new ArrayList<>();
        int position = 1;
        for (Cart.Item item : cart.items()) {
            ProductSummary p = catalogue.get(item.productId());
            if (p == null) {
                throw new ResourceNotFoundException("Product", item.productId());
            }
            if (!p.active()) {
                throw SaleErrors.productInactive(p.sku());
            }
            lines.add(
                    SaleLine.priced(
                            position++,
                            p.id(),
                            p.name(),
                            p.sku(),
                            p.unit(),
                            item.quantity(),
                            p.salePrice()));
        }
        return lines;
    }

    private static PaymentMethod paymentMethod(String value) {
        return Arrays.stream(PaymentMethod.values())
                .filter(m -> m.name().equals(value))
                .findFirst()
                .orElseThrow(SaleErrors::paymentMethodInvalid);
    }

    private static String idempotencyKey(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String key = value.strip();
        if (!IDEMPOTENCY_KEY.matcher(key).matches()) {
            throw SaleErrors.idempotencyKeyInvalid();
        }
        return key;
    }
}
