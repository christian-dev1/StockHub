package com.stockhub.product;

import java.util.UUID;

/**
 * Extension point implemented by modules that know whether a product is in
 * use (the stock module: quantities on hand). The catalogue asks before
 * deleting a product or switching its batch tracking.
 */
public interface ProductUsageGuard {

    boolean holdsStock(UUID companyId, UUID productId);
}
