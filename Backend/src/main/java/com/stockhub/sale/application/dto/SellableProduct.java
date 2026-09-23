package com.stockhub.sale.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A product as the point of sale needs it: sale price and quantity that can be sold at one
 * location. Purchase price and stock settings are deliberately absent.
 *
 * @param availableQuantity stock of the location; for batch-tracked products only non-expired
 *     batches count, as they are the only ones a sale may take
 */
public record SellableProduct(
        UUID id,
        String sku,
        String barcode,
        String name,
        String description,
        UUID categoryId,
        String categoryName,
        String unit,
        BigDecimal salePrice,
        boolean batchTracked,
        boolean hasImage,
        BigDecimal availableQuantity) {}
