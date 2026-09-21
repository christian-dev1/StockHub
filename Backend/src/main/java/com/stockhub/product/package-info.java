/**
 * Product catalogue of a company: categories, products (identification,
 * pricing, thresholds, batch / expiry tracking), product images and bulk
 * import. Exposes {@link com.stockhub.product.ProductCatalog} to the stock,
 * purchasing, sales and barcode modules.
 */
@ApplicationModule(displayName = "Catalogue", allowedDependencies = {"audit", "supplier", "shared"})
package com.stockhub.product;

import org.springframework.modulith.ApplicationModule;
