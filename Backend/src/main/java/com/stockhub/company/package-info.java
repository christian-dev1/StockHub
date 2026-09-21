/**
 * Companies (tenants) of StockHub: profile, settings, lifecycle and onboarding.
 * Onboarding atomically creates the company, its primary location and its first
 * administrator through the public APIs of the warehouse and user modules.
 */
@ApplicationModule(displayName = "Companies", allowedDependencies = {"audit", "warehouse", "user", "shared"})
package com.stockhub.company;

import org.springframework.modulith.ApplicationModule;
