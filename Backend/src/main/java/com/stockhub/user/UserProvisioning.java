package com.stockhub.user;

import java.util.UUID;

/** Creation of privileged accounts by other modules (company onboarding, bootstrap). */
public interface UserProvisioning {

    /** Creates an ADMIN of the company with a temporary password, in the caller's transaction. */
    UUID createCompanyAdmin(UUID companyId, String email, String firstName, String lastName, String temporaryPassword);

    /** Creates the platform super admin if no account exists with this email. */
    void ensureSuperAdmin(String email, String firstName, String lastName, String password);
}
