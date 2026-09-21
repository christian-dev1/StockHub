/**
 * Authentication: login, short-lived JWT access tokens, rotating refresh
 * tokens with reuse detection, logout and the current session ("me").
 * Also owns the HTTP security configuration of the API.
 */
@ApplicationModule(displayName = "Authentication", allowedDependencies = {"user", "company", "warehouse", "audit", "shared"})
package com.stockhub.auth;

import org.springframework.modulith.ApplicationModule;
