package com.stockhub.demo;

import com.stockhub.company.CompanyProvisioning;
import com.stockhub.company.CompanyProvisioning.NewAdmin;
import com.stockhub.company.CompanyProvisioning.NewCompany;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.UserProvisioning;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Creates two demo companies (Alpha Market, Beta Distribution) with one account
 * per role. Idempotent: skipped when the demo admin already exists.
 * All demo passwords are {@value #PASSWORD} and are documented in the README.
 */
@Component
@Profile("demo")
@Order(10)
class DemoDataInitializer implements ApplicationRunner {

    static final String PASSWORD = "StockHub2026";
    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final CompanyProvisioning companies;
    private final UserProvisioning users;
    private final TransactionTemplate transaction;

    DemoDataInitializer(CompanyProvisioning companies, UserProvisioning users, TransactionTemplate transaction) {
        this.companies = companies;
        this.users = users;
        this.transaction = transaction;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.exists("admin@alpha.cm")) {
            log.info("Demo data already present");
            return;
        }
        transaction.executeWithoutResult(status -> {
            seed("Alpha Market", "alpha.cm", "Douala");
            seed("Beta Distribution", "beta.cm", "Yaoundé");
        });
        log.info("Demo data created: see README (password {})", PASSWORD);
    }

    private void seed(String name, String domain, String city) {
        var company = companies.provision(
                new NewCompany(name, name + " SARL", "contact@" + domain, "+237 600 000 000", "Rue de la Joie", city,
                        "CM", "XAF", "Africa/Douala", "fr"),
                new NewAdmin("admin@" + domain, "Aline", "Admin", PASSWORD, false));
        var companyId = company.companyId();
        var store = Set.of(company.primaryLocationId());
        users.provisionUser(companyId, "manager@" + domain, "Marc", "Manager", RoleCode.MANAGER, true, Set.of(), PASSWORD, false);
        users.provisionUser(companyId, "magasinier@" + domain, "Moussa", "Magasinier", RoleCode.MAGASINIER, false, store, PASSWORD, false);
        users.provisionUser(companyId, "vendeur@" + domain, "Vanessa", "Vendeur", RoleCode.VENDEUR, false, store, PASSWORD, false);
    }
}
