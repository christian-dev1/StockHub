/**
 * Suppliers of a company: identity, contact details and delivery lead time.
 * Exposes {@link com.stockhub.supplier.SupplierApi} to the catalogue, purchasing
 * and forecasting modules.
 */
@ApplicationModule(displayName = "Suppliers", allowedDependencies = {"audit", "shared"})
package com.stockhub.supplier;

import org.springframework.modulith.ApplicationModule;
