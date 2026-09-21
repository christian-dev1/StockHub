package com.stockhub.company.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.company.domain.model.Company;
import com.stockhub.company.domain.valueobject.CompanyContact;
import com.stockhub.company.domain.valueobject.CompanySettings;
import com.stockhub.company.domain.valueobject.Localization;
import org.junit.jupiter.api.Test;

class CompanyTest {

    @Test
    void newCompanyIsActiveWithSafeDefaults() {
        Company company = Company.create("  Alpha Market ", null, CompanyContact.empty(), Localization.DEFAULT);
        assertThat(company.name()).isEqualTo("Alpha Market");
        assertThat(company.isActive()).isTrue();
        assertThat(company.settings().allowNegativeStock()).isFalse();
    }

    @Test
    void canBeDisabledAndReactivated() {
        Company company = Company.create("Beta", null, CompanyContact.empty(), Localization.DEFAULT);
        company.disable();
        assertThat(company.isActive()).isFalse();
        company.activate();
        assertThat(company.isActive()).isTrue();
    }

    @Test
    void validatesLocalization() {
        assertThatThrownBy(() -> new Localization("ZZZ", "Africa/Douala", "fr")).extracting("code")
                .isEqualTo("COMPANY_CURRENCY_INVALID");
        assertThatThrownBy(() -> new Localization("EUR", "Mars/Olympus", "fr")).extracting("code")
                .isEqualTo("COMPANY_TIMEZONE_INVALID");
        assertThatThrownBy(() -> new Localization("EUR", "Europe/Paris", "de")).extracting("code")
                .isEqualTo("COMPANY_LOCALE_UNSUPPORTED");
        assertThat(new Localization("eur", "Europe/Paris", "en").currency()).isEqualTo("EUR");
    }

    @Test
    void validatesContactAndSettings() {
        assertThatThrownBy(() -> new CompanyContact("bad", null, null, null, null)).extracting("code")
                .isEqualTo("COMPANY_EMAIL_INVALID");
        assertThatThrownBy(() -> new CompanyContact(null, null, null, null, "CMR")).extracting("code")
                .isEqualTo("COMPANY_COUNTRY_INVALID");
        assertThat(new CompanyContact(" ", null, null, null, "cm").country()).isEqualTo("CM");
        assertThatThrownBy(() -> new CompanySettings(false, 0, 7)).extracting("code")
                .isEqualTo("COMPANY_SETTING_OUT_OF_RANGE");
    }
}
