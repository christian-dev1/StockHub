package com.stockhub.shared.infrastructure.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import com.stockhub.shared.application.CacheNames;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Short-lived local caches for hot security lookups (user authorities, company
 * status). Entries are evicted explicitly on change; the TTL bounds staleness.
 */
@Configuration(proxyBeanMethods = false)
@EnableCaching
class CacheConfig {

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(CacheNames.USER_AUTHORITIES, CacheNames.COMPANY_STATUS);
        manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(Duration.ofSeconds(60)).maximumSize(10_000));
        return manager;
    }
}
