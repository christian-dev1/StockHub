package com.stockhub.stock.application.usecase;

import com.stockhub.company.CompanyApi;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.product.ProductCatalog;
import com.stockhub.product.ProductSummary;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.shared.security.LocationAccessPolicy;
import com.stockhub.user.UserDirectory;
import com.stockhub.warehouse.LocationApi;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Who acts, for which company, and "today" in the company's time zone (used for expiry). Also
 * resolves products and locations strictly within the company, and checks that the user may operate
 * on a location.
 */
@Component
class StockContext {

    /** Everything an operation needs about its actor and company. */
    record Operation(
            UUID companyId,
            UUID userId,
            String userName,
            CompanySnapshot company,
            Instant now,
            LocalDate today) {

        boolean allowNegativeStock() {
            return company.allowNegativeStock();
        }

        int expiryWarningDays() {
            return company.expiryWarningDays();
        }
    }

    private final CurrentUserProvider currentUser;
    private final CompanyApi companies;
    private final UserDirectory users;
    private final ProductCatalog products;
    private final LocationApi locations;
    private final LocationAccessPolicy locationAccess;
    private final Clock clock;

    StockContext(
            CurrentUserProvider currentUser,
            CompanyApi companies,
            UserDirectory users,
            ProductCatalog products,
            LocationApi locations,
            LocationAccessPolicy locationAccess,
            Clock clock) {
        this.currentUser = currentUser;
        this.companies = companies;
        this.users = users;
        this.products = products;
        this.locations = locations;
        this.locationAccess = locationAccess;
        this.clock = clock;
    }

    Operation begin() {
        CurrentUser user = currentUser.require();
        UUID companyId = user.requireCompanyId();
        CompanySnapshot company = companies.find(companyId).orElseThrow();
        Instant now = clock.instant();
        String name =
                users.loadAuthorities(user.userId())
                        .map(a -> (a.firstName() + " " + a.lastName()).strip())
                        .filter(n -> !n.isEmpty())
                        .orElse(user.email());
        return new Operation(companyId, user.userId(), name, company, now, today(company, now));
    }

    /** Today in the company time zone. */
    LocalDate today(CompanySnapshot company, Instant now) {
        return LocalDate.ofInstant(now, ZoneId.of(company.timezone()));
    }

    CompanySnapshot company() {
        return companies.find(currentUser.require().requireCompanyId()).orElseThrow();
    }

    /** Locations the current user may see, or null when he may see all of them. */
    Set<UUID> allowedLocations() {
        CurrentUser user = currentUser.require();
        return user.allLocations() ? null : user.locationIds();
    }

    UUID companyId() {
        return currentUser.require().requireCompanyId();
    }

    /**
     * A product of the company (inactive products included); unknown ones are a validation error.
     */
    ProductSummary product(UUID companyId, UUID productId, String field) {
        if (productId == null) {
            throw new InvalidInputException(field, "PRODUCT_REQUIRED", "A product is required.");
        }
        return products.find(companyId, productId)
                .orElseThrow(
                        () ->
                                new com.stockhub.shared.domain.exception.ResourceNotFoundException(
                                        "Product", productId));
    }

    /**
     * An active location of the company, that the user is allowed to operate on (403
     * LOCATION_ACCESS_DENIED otherwise).
     */
    void requireOperableLocation(UUID companyId, UUID locationId, String field) {
        requireActiveLocation(companyId, locationId, field);
        locationAccess.requireAccess(locationId);
    }

    void requireActiveLocation(UUID companyId, UUID locationId, String field) {
        if (locationId == null) {
            throw new InvalidInputException(field, "LOCATION_REQUIRED", "A location is required.");
        }
        if (locations.findActiveIds(companyId, List.of(locationId)).isEmpty()) {
            throw new com.stockhub.shared.domain.exception.ResourceNotFoundException(
                    "Location", locationId);
        }
    }
}
