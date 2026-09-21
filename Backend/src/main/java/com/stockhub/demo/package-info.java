/**
 * Demonstration data, active only with the {@code demo} Spring profile. It
 * drives the public APIs of the business modules, exactly like a user would.
 */
@ApplicationModule(displayName = "Demo data", allowedDependencies = {"company", "user", "shared"})
package com.stockhub.demo;

import org.springframework.modulith.ApplicationModule;
