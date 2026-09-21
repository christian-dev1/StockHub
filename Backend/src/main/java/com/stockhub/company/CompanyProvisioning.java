package com.stockhub.company;

import java.util.UUID;

/** System-level company creation (demo data, future imports), without an acting super admin. */
public interface CompanyProvisioning {

    ProvisionedCompany provision(NewCompany company, NewAdmin admin);

    record NewCompany(String name, String legalName, String email, String phone, String addressLine, String city,
                      String country, String currency, String timezone, String locale) {
    }

    /** @param temporaryPassword whether the administrator must change the password at first sign-in */
    record NewAdmin(String email, String firstName, String lastName, String password, boolean temporaryPassword) {
    }

    record ProvisionedCompany(UUID companyId, UUID primaryLocationId, UUID adminUserId) {
    }
}
