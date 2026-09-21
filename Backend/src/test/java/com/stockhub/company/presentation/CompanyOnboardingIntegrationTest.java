package com.stockhub.company.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

class CompanyOnboardingIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void onboardingCreatesCompanyPrimaryLocationAndAdminAtomically() throws Exception {
        String name = "Alpha Market " + UUID.randomUUID().toString().substring(0, 6);
        String adminEmail = ApiFixtures.uniqueEmail("alpha");
        var created = api.onboard(name, adminEmail);

        assertThat(created.at("/company/status").asString()).isEqualTo("ACTIVE");
        assertThat(created.at("/company/settings/allowNegativeStock").asBoolean()).isFalse();
        var admin = api.activate(adminEmail);
        mvc.perform(get("/api/v1/locations").header("Authorization", admin.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value(name + " - Principal"))
                .andExpect(jsonPath("$[0].primary").value(true))
                .andExpect(jsonPath("$[0].type").value("STORE"));

        Integer audits = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE action = 'COMPANY_CREATED' AND entity_id = ?",
                Integer.class, created.at("/company/id").asString());
        assertThat(audits).isEqualTo(1);
    }

    @Test
    void failedOnboardingLeavesNothingBehind() throws Exception {
        String takenEmail = ApiFixtures.uniqueEmail("taken");
        api.onboard("First " + UUID.randomUUID(), takenEmail);
        String name = "Rolled Back " + UUID.randomUUID();

        mvc.perform(api.jsonPost("/api/v1/platform/companies", api.superAdmin(), api.onboardingPayload(name, takenEmail)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_EMAIL_ALREADY_EXISTS"));

        Integer companies = jdbc.queryForObject("SELECT count(*) FROM companies WHERE name = ?", Integer.class, name);
        assertThat(companies).isZero();
    }

    @Test
    void companyNamesAreUniqueIgnoringCase() throws Exception {
        String name = "Unique " + UUID.randomUUID();
        api.onboard(name, ApiFixtures.uniqueEmail("u1"));
        mvc.perform(api.jsonPost("/api/v1/platform/companies", api.superAdmin(),
                        api.onboardingPayload(name.toUpperCase(), ApiFixtures.uniqueEmail("u2"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMPANY_NAME_ALREADY_EXISTS"));
    }

    @Test
    void invalidLocalizationIsRejectedWithFieldError() throws Exception {
        var payload = new java.util.HashMap<>(api.onboardingPayload("Bad " + UUID.randomUUID(), ApiFixtures.uniqueEmail("bad")));
        payload.put("currency", "ZZZ");
        mvc.perform(api.jsonPost("/api/v1/platform/companies", api.superAdmin(), payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMPANY_CURRENCY_INVALID"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("currency"));
    }

    @Test
    void weakAdminPasswordIsRejected() throws Exception {
        var payload = new java.util.HashMap<>(api.onboardingPayload("Weak " + UUID.randomUUID(), ApiFixtures.uniqueEmail("weak")));
        payload.put("admin", Map.of("email", ApiFixtures.uniqueEmail("weak"), "firstName", "A", "lastName", "B",
                "temporaryPassword", "abcdefghijkl"));
        mvc.perform(api.jsonPost("/api/v1/platform/companies", api.superAdmin(), payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PASSWORD_TOO_WEAK"));
    }

    @Test
    void platformListsAndSearchesCompanies() throws Exception {
        String marker = "Searchable" + UUID.randomUUID().toString().substring(0, 6);
        api.onboard(marker + " SARL", ApiFixtures.uniqueEmail("s"));
        mvc.perform(get("/api/v1/platform/companies").param("q", marker.toLowerCase())
                        .header("Authorization", api.superAdmin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value(marker + " SARL"));
    }

    @Test
    void adminUpdatesOwnCompanySettingsWithOptimisticLocking() throws Exception {
        var tenant = api.newTenant("Settings");
        long version = api.getJson("/api/v1/company", tenant.admin()).get("version").asLong();
        Map<String, Object> settings = Map.of("currency", "EUR", "timezone", "Europe/Paris", "locale", "en",
                "allowNegativeStock", false, "expiryWarningDays", 45, "defaultLeadTimeDays", 10, "version", version);

        mvc.perform(put("/api/v1/company/settings").header("Authorization", tenant.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(settings)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.settings.expiryWarningDays").value(45));

        mvc.perform(put("/api/v1/company/settings").header("Authorization", tenant.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(settings)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENT_MODIFICATION"));
    }

    @Test
    void disablingACompanyCutsOffItsUsersImmediately() throws Exception {
        var tenant = api.newTenant("Disabled");
        var superAdmin = api.superAdmin();

        mvc.perform(api.jsonPost("/api/v1/platform/companies/" + tenant.companyId() + "/disable", superAdmin,
                        Map.of("reason", "Contract ended")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISABLED"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh").cookie(tenant.admin().refreshCookie()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_COMPANY_DISABLED"));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(api.toJson(Map.of("email", tenant.adminEmail(), "password", ApiFixtures.CHANGED_PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_COMPANY_DISABLED"));

        mvc.perform(post("/api/v1/platform/companies/" + tenant.companyId() + "/activate")
                        .header("Authorization", superAdmin.bearer()))
                .andExpect(status().isOk());
        api.login(tenant.adminEmail(), ApiFixtures.CHANGED_PASSWORD);
    }
}
