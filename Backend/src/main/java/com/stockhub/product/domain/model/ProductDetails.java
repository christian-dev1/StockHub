package com.stockhub.product.domain.model;

import com.stockhub.product.domain.valueobject.Pricing;
import com.stockhub.product.domain.valueobject.StockPolicy;
import com.stockhub.product.domain.valueobject.Unit;
import java.util.UUID;

/** Editable descriptive data of a product, validated by {@link Product}. */
public record ProductDetails(
        String name,
        String description,
        UUID categoryId,
        UUID defaultSupplierId,
        Unit unit,
        Pricing pricing,
        StockPolicy stockPolicy) {
}
