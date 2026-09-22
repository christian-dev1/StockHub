package com.stockhub.stock.application.port;

import com.stockhub.shared.domain.page.*;

import java.time.LocalDate;
import java.util.*;

public interface StockSearch {
    PageResult<Map<String, Object>> search(
            String kind,
            UUID company,
            Set<UUID> locations,
            Map<String, String> filters,
            PageQuery page,
            LocalDate today,
            int warningDays);
}
