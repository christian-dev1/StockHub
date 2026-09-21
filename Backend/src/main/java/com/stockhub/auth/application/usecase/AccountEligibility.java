package com.stockhub.auth.application.usecase;

import com.stockhub.auth.domain.exception.AuthErrors;
import com.stockhub.company.CompanyApi;
import com.stockhub.user.UserAuthorities;
import org.springframework.stereotype.Component;

/** A user may hold a session only while both the account and its company are active. */
@Component
class AccountEligibility {

    private final CompanyApi companies;

    AccountEligibility(CompanyApi companies) {
        this.companies = companies;
    }

    void require(UserAuthorities user) {
        if (!user.active()) {
            throw AuthErrors.accountDisabled();
        }
        if (user.companyId() != null && !companies.isActive(user.companyId())) {
            throw AuthErrors.companyDisabled();
        }
    }
}
