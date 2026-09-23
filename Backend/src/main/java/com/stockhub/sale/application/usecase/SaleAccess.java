package com.stockhub.sale.application.usecase;

import com.stockhub.company.CompanyApi;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.sale.application.dto.SaleView;
import com.stockhub.sale.application.port.SaleReadModel;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.shared.security.RoleCode;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Visibility rules of sales, decided server side from the authenticated user only:
 *
 * <ul>
 *   <li>a VENDEUR sees only the sales he performed, whatever the request asks;
 *   <li>other roles holding SALE_VIEW see the sales of the locations they may access, or only
 *       their own when they ask for them.
 * </ul>
 */
@Component
class SaleAccess {
    private final CurrentUserProvider currentUser;
    private final CompanyApi companies;
    private final Clock clock;

    SaleAccess(CurrentUserProvider currentUser, CompanyApi companies, Clock clock) {
        this.currentUser = currentUser;
        this.companies = companies;
        this.clock = clock;
    }

    CurrentUser user() {
        return currentUser.require();
    }

    CompanySnapshot company() {
        return companies.find(user().requireCompanyId()).orElseThrow();
    }

    ZoneId zone(CompanySnapshot company) {
        return ZoneId.of(company.timezone());
    }

    LocalDate today(CompanySnapshot company) {
        return LocalDate.now(clock.withZone(zone(company)));
    }

    static boolean ownSalesOnly(CurrentUser user) {
        return user.role() == RoleCode.VENDEUR;
    }

    SaleReadModel.Scope scope(boolean mine) {
        CurrentUser user = user();
        boolean own = mine || ownSalesOnly(user);
        return new SaleReadModel.Scope(
                user.requireCompanyId(),
                own ? user.userId() : null,
                own || user.allLocations() ? null : user.locationIds());
    }

    boolean canSee(SaleView sale) {
        CurrentUser user = user();
        if (sale.sellerId().equals(user.userId())) {
            return true;
        }
        return !ownSalesOnly(user) && user.canAccessLocation(sale.locationId());
    }
}
