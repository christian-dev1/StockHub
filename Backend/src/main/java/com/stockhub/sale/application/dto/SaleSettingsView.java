package com.stockhub.sale.application.dto;

import com.stockhub.sale.domain.model.PaymentMethod;

import java.util.List;

/**
 * Company rules the point of sale must follow; read-only for sellers.
 *
 * @param currency company currency, set by the company administrator only
 * @param allowNegativeStock when false, a sale may not take more than the available stock
 */
public record SaleSettingsView(
        String currency, boolean allowNegativeStock, List<PaymentMethod> paymentMethods) {}
