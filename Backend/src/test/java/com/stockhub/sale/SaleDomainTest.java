package com.stockhub.sale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.sale.domain.model.Cart;
import com.stockhub.sale.domain.model.PaymentMethod;
import com.stockhub.sale.domain.model.Sale;
import com.stockhub.sale.domain.model.SaleLine;
import com.stockhub.shared.domain.exception.InvalidInputException;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

class SaleDomainTest {
    private static final UUID P1 = UUID.randomUUID();
    private static final UUID P2 = UUID.randomUUID();

    @Test
    void cartRejectsEmptyDuplicateAndInvalidQuantities() {
        assertCode(() -> new Cart(null), "SALE_EMPTY");
        assertCode(() -> new Cart(List.of()), "SALE_EMPTY");
        assertCode(() -> new Cart(Arrays.asList((Cart.Item) null)), "PRODUCT_REQUIRED");
        assertCode(() -> new Cart(List.of(item(P1, "0"))), "QUANTITY_INVALID");
        assertCode(() -> new Cart(List.of(item(P1, "-1"))), "QUANTITY_INVALID");
        assertCode(() -> new Cart(List.of(item(P1, "1.0001"))), "QUANTITY_INVALID");
        assertCode(() -> new Cart(List.of(item(P1, "1"), item(P1, "2"))), "SALE_DUPLICATE_PRODUCT");
        assertThat(new Cart(List.of(item(P1, "1.5"), item(P2, "2"))).productIds()).containsExactly(P1, P2);
    }

    @Test
    void totalIsTheSumOfLinesComputedFromUnitPrices() {
        var lines =
                List.of(
                        SaleLine.priced(1, P1, "Eau", "EAU", "UNIT", new BigDecimal("3"), new BigDecimal("500")),
                        SaleLine.priced(2, P2, "Sucre", "SUC", "KG", new BigDecimal("1.25"), new BigDecimal("800")));
        Sale sale =
                Sale.complete(UUID.randomUUID(), UUID.randomUUID(), "VT-2026-000001", UUID.randomUUID(), "Vanessa",
                        "   ", PaymentMethod.CASH, "XAF", UUID.randomUUID(), null, Instant.now(), lines);

        assertThat(sale.totalAmount()).isEqualByComparingTo("2500");
        assertThat(sale.customerName()).isNull();
        assertThatThrownBy(
                        () -> new Sale(sale.id(), sale.companyId(), sale.locationId(), sale.number(), sale.status(),
                                sale.sellerId(), sale.sellerName(), null, sale.paymentMethod(), sale.currency(),
                                BigDecimal.ONE, sale.stockDocumentId(), null, sale.createdAt(), lines))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static Cart.Item item(UUID product, String quantity) {
        return new Cart.Item(product, new BigDecimal(quantity));
    }

    private static void assertCode(Runnable action, String code) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(InvalidInputException.class, e -> assertThat(e.code()).isEqualTo(code));
    }
}
