package com.stockhub.product.domain.valueobject;

import com.stockhub.shared.domain.exception.InvalidInputException;

/** Batch and expiry tracking; expiry dates live on batches, so expiry tracking implies batch tracking. */
public record Tracking(boolean batchTracked, boolean expiryTracked) {

    public static final Tracking NONE = new Tracking(false, false);

    public Tracking {
        if (expiryTracked && !batchTracked) {
            throw new InvalidInputException("expiryTracked", "PRODUCT_EXPIRY_REQUIRES_BATCH",
                    "Expiry tracking requires batch tracking.");
        }
    }
}
