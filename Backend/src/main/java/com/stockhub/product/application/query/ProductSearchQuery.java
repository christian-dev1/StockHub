package com.stockhub.product.application.query;

import com.stockhub.product.domain.repository.ProductSearchCriteria;
import com.stockhub.shared.domain.page.PageQuery;

public record ProductSearchQuery(ProductSearchCriteria criteria, PageQuery page) {
}
