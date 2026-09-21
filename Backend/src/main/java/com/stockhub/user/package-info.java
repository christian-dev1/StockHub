/**
 * Users of StockHub: identity, role, accessible locations, lifecycle and
 * password management. Exposes {@link com.stockhub.user.UserDirectory} to the
 * auth module and {@link com.stockhub.user.UserProvisioning} to onboarding.
 */
@ApplicationModule(displayName = "Users", allowedDependencies = {"audit", "warehouse", "shared"})
package com.stockhub.user;

import org.springframework.modulith.ApplicationModule;
