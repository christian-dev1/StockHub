/**
 * Stock locations of a company: stores, warehouses and depots. Every company
 * owns exactly one primary location, created together with the company.
 */
@ApplicationModule(displayName = "Locations", allowedDependencies = {"audit", "shared"})
package com.stockhub.warehouse;

import org.springframework.modulith.ApplicationModule;
