package com.stockhub.user.application.port;

import java.util.UUID;

/** Invalidates cached authorities so permission changes apply on the next request. */
public interface AuthorityCache {

    void evict(UUID userId);
}
