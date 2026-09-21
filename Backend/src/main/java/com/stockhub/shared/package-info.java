/**
 * Technical kernel shared by every business module: error model, web plumbing,
 * security context and cross-cutting configuration. It must never contain
 * business rules of a specific module.
 */
@ApplicationModule(displayName = "Shared kernel", type = ApplicationModule.Type.OPEN)
package com.stockhub.shared;

import org.springframework.modulith.ApplicationModule;
