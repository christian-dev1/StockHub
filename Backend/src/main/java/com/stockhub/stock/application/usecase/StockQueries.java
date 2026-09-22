package com.stockhub.stock.application.usecase;

import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.domain.page.*;
import com.stockhub.stock.application.port.StockSearch;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class StockQueries {
    private final StockContext context;
    private final StockSearch search;
    private final Clock clock;

    public StockQueries(StockContext context, StockSearch search, Clock clock) {
        this.context = context;
        this.search = search;
        this.clock = clock;
    }

    public PageResult<Map<String, Object>> list(
            String kind, Map<String, String> filters, PageQuery page) {
        var company = context.company();
        try {
            return search.search(
                    kind,
                    context.companyId(),
                    context.allowedLocations(),
                    filters,
                    page,
                    context.today(company, clock.instant()),
                    company.expiryWarningDays());
        } catch (IllegalArgumentException | java.time.DateTimeException e) {
            throw new com.stockhub.shared.domain.exception.InvalidInputException(
                    "filters", "INVALID_FILTER", "Invalid filter value.");
        }
    }

    public Map<String, Object> get(String kind, UUID id) {
        var result = list(kind, Map.of("id", id.toString()), PageQuery.of(0, 1)).content();
        if (result.isEmpty()) throw new ResourceNotFoundException(kind, id);
        var row = result.getFirst();
        if (kind.equals("stock-documents")) {
            List<Map<String, Object>> lines = new ArrayList<>();
            int page = 0;
            PageResult<Map<String, Object>> part;
            do {
                part =
                        list(
                                "stock-movements",
                                Map.of("documentId", id.toString()),
                                PageQuery.of(page++, 100));
                lines.addAll(part.content());
            } while (page < part.totalPages());
            row.put("lines", lines);
        }
        return row;
    }

    public PageResult<Map<String, Object>> product(
            UUID product, Map<String, String> filters, PageQuery page) {
        context.product(context.companyId(), product, "productId");
        var f = new HashMap<>(filters);
        f.put("productId", product.toString());
        return list("stocks", f, page);
    }
}
