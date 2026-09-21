package com.stockhub.supplier.application.query;

import com.stockhub.shared.domain.page.PageQuery;

public record SupplierSearchQuery(String text, Boolean active, PageQuery page) {
}
