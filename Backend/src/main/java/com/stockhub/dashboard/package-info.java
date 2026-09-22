/**
 * Read-only dashboards: aggregated stock, activity and platform figures computed by PostgreSQL
 * (COUNT, SUM, GROUP BY). It never writes and owns no table; it reads the tables of the stock,
 * catalogue, warehouse, company, user and audit modules through SQL only, so it adds no code
 * dependency on their internals. Scope (company, locations) always comes from the authenticated
 * user. Sales figures are intentionally absent until a sale module exists.
 */
@ApplicationModule(displayName = "Dashboard", allowedDependencies = {"company", "shared"})
package com.stockhub.dashboard;

import org.springframework.modulith.ApplicationModule;
