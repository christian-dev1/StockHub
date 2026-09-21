package com.stockhub.company.infrastructure.config;

import com.stockhub.company.application.port.CompanyStatusCache;
import com.stockhub.shared.application.CacheNames;
import java.util.UUID;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
class SpringCompanyStatusCache implements CompanyStatusCache {

    private final CacheManager cacheManager;

    SpringCompanyStatusCache(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void evict(UUID companyId) {
        evictNow(companyId);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evictNow(companyId);
                }
            });
        }
    }

    private void evictNow(UUID companyId) {
        Cache cache = cacheManager.getCache(CacheNames.COMPANY_STATUS);
        if (cache != null) {
            cache.evict(companyId);
        }
    }
}
