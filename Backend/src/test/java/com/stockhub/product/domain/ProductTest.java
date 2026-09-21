package com.stockhub.product.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.product.domain.model.Product;
import com.stockhub.product.domain.model.ProductDetails;
import com.stockhub.product.domain.valueobject.Pricing;
import com.stockhub.product.domain.valueobject.StockPolicy;
import com.stockhub.product.domain.valueobject.Tracking;
import com.stockhub.product.domain.valueobject.Unit;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ProductTest {

    private static final UUID COMPANY = UUID.randomUUID();

    private static ProductDetails details(Unit unit, String minStock) {
        return new ProductDetails("  Eau minérale 1.5L ", null, null, null, unit,
                new Pricing(new BigDecimal("250"), new BigDecimal("400")), new StockPolicy(new BigDecimal(minStock), null));
    }

    @Test
    void normalisesSkuAndName() {
        Product product = Product.create(COMPANY, " eau-15 ", null, details(Unit.UNIT, "10"), Tracking.NONE);
        assertThat(product.sku()).isEqualTo("EAU-15");
        assertThat(product.name()).isEqualTo("Eau minérale 1.5L");
        assertThat(product.isActive()).isTrue();
    }

    @Test
    void expiryTrackingRequiresBatchTracking() {
        assertThatThrownBy(() -> new Tracking(false, true)).extracting("code")
                .isEqualTo("PRODUCT_EXPIRY_REQUIRES_BATCH");
    }

    @Test
    void discreteUnitsRefuseFractionalThresholds() {
        assertThatThrownBy(() -> Product.create(COMPANY, "A", null, details(Unit.UNIT, "2.5"), Tracking.NONE))
                .extracting("code").isEqualTo("QUANTITY_MUST_BE_WHOLE");
        assertThat(Product.create(COMPANY, "B", null, details(Unit.KG, "2.5"), Tracking.NONE).stockPolicy().minStock())
                .isEqualByComparingTo("2.5");
    }

    @Test
    void refusesNegativePricesAndInvalidSku() {
        assertThatThrownBy(() -> new Pricing(new BigDecimal("-1"), BigDecimal.ONE)).extracting("code")
                .isEqualTo("PRODUCT_PRICE_NEGATIVE");
        assertThatThrownBy(() -> Product.create(COMPANY, "bad sku!", null, details(Unit.UNIT, "0"), Tracking.NONE))
                .extracting("code").isEqualTo("PRODUCT_SKU_INVALID");
    }

    @Test
    void batchTrackingIsLockedWhileStockIsHeld() {
        Product product = Product.create(COMPANY, "C", null, details(Unit.UNIT, "0"), Tracking.NONE);
        Tracking batches = new Tracking(true, true);
        assertThatThrownBy(() -> product.changeTracking(batches, true)).extracting("code")
                .isEqualTo("PRODUCT_TRACKING_LOCKED");
        product.changeTracking(batches, false);
        assertThat(product.tracking()).isEqualTo(batches);
    }

    @Test
    void deletedProductCannotBeChanged() {
        Product product = Product.create(COMPANY, "D", null, details(Unit.UNIT, "0"), Tracking.NONE);
        product.delete();
        assertThat(product.isActive()).isFalse();
        assertThatThrownBy(product::activate).extracting("code").isEqualTo("PRODUCT_DELETED");
    }

    @Test
    void flagsSaleBelowCost() {
        assertThat(new Pricing(new BigDecimal("500"), new BigDecimal("450")).sellsAtLoss()).isTrue();
    }
}
