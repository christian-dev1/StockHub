/**
 * Stock engine: quantities per location, batches with expiry (FEFO), the append-only movement
 * ledger and stock notes (entries, exits, adjustments, transfers). Plugs into the catalogue and
 * locations through their guards.
 */
@ApplicationModule(
        displayName = "Stock",
        allowedDependencies = {"product", "warehouse", "company", "user", "audit", "shared"})
package com.stockhub.stock;

import org.springframework.modulith.ApplicationModule;
