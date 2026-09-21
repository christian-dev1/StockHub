package com.stockhub.company.application.query;

import com.stockhub.company.domain.model.CompanyStatus;
import com.stockhub.shared.domain.page.PageQuery;

public record CompanySearchQuery(String text, CompanyStatus status, PageQuery page) {
}
