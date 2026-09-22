package com.stockhub.stock.application.usecase;

import com.stockhub.product.ProductUsageGuard;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.stock.domain.repository.StockLevelRepository;
import com.stockhub.warehouse.LocationDeactivationGuard;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
class StockGuards implements ProductUsageGuard, LocationDeactivationGuard {
    private final StockLevelRepository levels;

    StockGuards(StockLevelRepository levels) {
        this.levels = levels;
    }

    public boolean holdsStock(UUID company, UUID product) {
        return levels.productHoldsStock(company, product);
    }

    public void checkDeactivation(UUID company, UUID location) {
        if (levels.locationHoldsStock(company, location))
            throw new BusinessRuleViolationException(
                    "LOCATION_HAS_STOCK", "Location still holds stock.");
    }
}
