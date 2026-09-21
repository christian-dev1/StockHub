/**
 * Barcodes: generation of unique values for products without one (EAN-13 in
 * the GS1 in-store range, or CODE128), rendering (PNG / SVG) and printable
 * label sheets (PDF).
 */
@ApplicationModule(displayName = "Barcodes", allowedDependencies = {"product", "company", "shared"})
package com.stockhub.barcode;

import org.springframework.modulith.ApplicationModule;
