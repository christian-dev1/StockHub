package com.stockhub.user.infrastructure.config;

import com.stockhub.shared.application.CacheNames;
import com.stockhub.user.application.port.AuthorityCache;
import java.util.UUID;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Evicts after commit so a concurrent request cannot re-cache the pre-change state. */
@Component
class SpringAuthorityCache implements AuthorityCache {

    private final CacheManager cacheManager;

    SpringAuthorityCache(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void evict(UUID userId) {
        evictNow(userId);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evictNow(userId);
                }
            });
        }
    }

    private void evictNow(UUID userId) {
        Cache cache = cacheManager.getCache(CacheNames.USER_AUTHORITIES);
        if (cache != null) {
            cache.evict(userId);
        }
    }
}
