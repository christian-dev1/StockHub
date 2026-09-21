package com.stockhub.user.infrastructure.config;

import com.stockhub.user.UserProvisioning;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Creates the platform super admin from environment variables on first start.
 * No credential is ever hard-coded or shipped in migrations.
 */
@Component
class SuperAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrap.class);

    private final UserProvisioning provisioning;
    private final String email;
    private final String password;

    SuperAdminBootstrap(UserProvisioning provisioning,
                        @Value("${stockhub.bootstrap.super-admin.email:}") String email,
                        @Value("${stockhub.bootstrap.super-admin.password:}") String password) {
        this.provisioning = provisioning;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            log.info("No bootstrap super admin configured (stockhub.bootstrap.super-admin.*)");
            return;
        }
        provisioning.ensureSuperAdmin(email, "Super", "Admin", password);
    }
}
