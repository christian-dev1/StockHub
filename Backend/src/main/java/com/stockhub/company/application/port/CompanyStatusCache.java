package com.stockhub.company.application.port;

import java.util.UUID;

public interface CompanyStatusCache {

    void evict(UUID companyId);
}
