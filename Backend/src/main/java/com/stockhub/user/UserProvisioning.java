package com.stockhub.user;

import com.stockhub.shared.security.RoleCode;
import java.util.Set;
import java.util.UUID;

/** Creation of accounts by other modules (company onboarding, bootstrap, demo data). */
public interface UserProvisioning {

    /** Creates an ADMIN of the company with a temporary password, in the caller's transaction. */
    UUID createCompanyAdmin(UUID companyId, String email, String firstName, String lastName, String temporaryPassword);

    /**
     * Creates a company user without an acting administrator (system provisioning).
     * {@code temporary} controls whether the password must be changed at first sign-in.
     */
    UUID provisionUser(UUID companyId, String email, String firstName, String lastName, RoleCode role,
                       boolean allLocations, Set<UUID> locationIds, String password, boolean temporary);

    /** Creates the platform super admin if no account exists with this email. */
    void ensureSuperAdmin(String email, String firstName, String lastName, String password);

    boolean exists(String email);
}
