/**
 * Point-of-sale sales: a sale is priced server side from the catalogue, issues its goods through
 * the stock engine in the same transaction and is then immutable. Sellers (VENDEUR) only ever see
 * their own sales; other roles holding SALE_VIEW see the sales of the locations they may access.
 * There is no customer master: the optional customer name is plain text stored with the sale.
 */
@ApplicationModule(
        displayName = "Sales",
        allowedDependencies = {"product", "stock", "warehouse", "company", "audit", "shared"})
package com.stockhub.sale;

import org.springframework.modulith.ApplicationModule;
