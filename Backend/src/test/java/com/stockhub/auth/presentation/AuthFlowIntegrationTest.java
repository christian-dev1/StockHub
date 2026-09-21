package com.stockhub.auth.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures;
import com.stockhub.support.ApiFixtures.Session;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;

class AuthFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void loginReturnsAccessTokenSessionAndHardenedRefreshCookie() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(api.toJson(Map.of("email", ApiFixtures.SUPER_ADMIN_EMAIL,
                                "password", ApiFixtures.SUPER_ADMIN_PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(jsonPath("$.session.role").value("SUPER_ADMIN"))
                .andExpect(jsonPath("$.session.company").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().httpOnly("stockhub_refresh", true))
                .andExpect(cookie().secure("stockhub_refresh", true))
                .andExpect(cookie().path("stockhub_refresh", "/api/v1/auth"))
                .andExpect(cookie().sameSite("stockhub_refresh", "Strict"));
    }

    @Test
    void wrongPasswordAndUnknownEmailAreIndistinguishable() throws Exception {
        for (String email : new String[] {ApiFixtures.SUPER_ADMIN_EMAIL, "nobody@nowhere.test"}) {
            mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(api.toJson(Map.of("email", email, "password", "WrongPassword123"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        }
    }

    @Test
    void meDescribesTheCompanySessionWithPermissionsAndLocations() throws Exception {
        var tenant = api.newTenant("Me");
        mvc.perform(get("/api/v1/auth/me").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andExpect(jsonPath("$.company.id").value(tenant.companyId().toString()))
                .andExpect(jsonPath("$.company.currency").value("XAF"))
                .andExpect(jsonPath("$.locations[0].primary").value(true))
                .andExpect(jsonPath("$.permissions").isArray());
    }

    @Test
    void refreshRotatesTheTokenAndDetectsReuse() throws Exception {
        Session session = api.superAdmin();
        Cookie original = session.refreshCookie();

        MvcResult rotated = mvc.perform(post("/api/v1/auth/refresh").cookie(original))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();
        Cookie next = rotated.getResponse().getCookie("stockhub_refresh");
        assertThat(next.getValue()).isNotEqualTo(original.getValue());

        // Replaying the rotated token = theft: refused, and the whole family is revoked.
        mvc.perform(post("/api/v1/auth/refresh").cookie(original))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REFRESH_TOKEN_INVALID"))
                .andExpect(cookie().maxAge("stockhub_refresh", 0));
        mvc.perform(post("/api/v1/auth/refresh").cookie(next)).andExpect(status().isUnauthorized());

        Integer reuseAudits = jdbc.queryForObject(
                "SELECT count(*) FROM audit_logs WHERE action = 'REFRESH_TOKEN_REUSE_DETECTED'", Integer.class);
        assertThat(reuseAudits).isPositive();
    }

    @Test
    void refreshWithoutCookieIsRejected() throws Exception {
        mvc.perform(post("/api/v1/auth/refresh")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTheSessionAndClearsTheCookie() throws Exception {
        Session session = api.superAdmin();
        mvc.perform(post("/api/v1/auth/logout").cookie(session.refreshCookie()))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("stockhub_refresh", 0));
        mvc.perform(post("/api/v1/auth/refresh").cookie(session.refreshCookie())).andExpect(status().isUnauthorized());
    }

    @Test
    void repeatedFailuresTemporarilyLockTheAccount() throws Exception {
        String email = ApiFixtures.uniqueEmail("locked");
        for (int attempt = 0; attempt < 5; attempt++) {
            mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(api.toJson(Map.of("email", email, "password", "Wrong-password-1"))))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(api.toJson(Map.of("email", email, "password", "Wrong-password-1"))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("AUTH_TOO_MANY_ATTEMPTS"));
    }

    @Test
    void temporaryPasswordGrantsNoPermissionUntilChanged() throws Exception {
        String adminEmail = ApiFixtures.uniqueEmail("temp");
        api.onboard("Temp Co " + adminEmail, adminEmail);
        Session temporary = api.login(adminEmail, ApiFixtures.PASSWORD);

        mvc.perform(get("/api/v1/auth/me").header("Authorization", temporary.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.permissions").isEmpty());
        mvc.perform(get("/api/v1/users").header("Authorization", temporary.bearer()))
                .andExpect(status().isForbidden());
    }

    @Test
    void changingPasswordRevokesExistingSessions() throws Exception {
        var tenant = api.newTenant("Pwd");
        Session before = api.login(tenant.adminEmail(), ApiFixtures.CHANGED_PASSWORD);

        mvc.perform(api.jsonPost("/api/v1/auth/change-password", before,
                        Map.of("currentPassword", ApiFixtures.CHANGED_PASSWORD, "newPassword", "Another2026secret")))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/auth/me").header("Authorization", before.bearer())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh").cookie(before.refreshCookie())).andExpect(status().isUnauthorized());
        api.login(tenant.adminEmail(), "Another2026secret");
    }

    @Test
    void changePasswordRequiresTheCurrentPassword() throws Exception {
        var tenant = api.newTenant("PwdBad");
        mvc.perform(api.jsonPost("/api/v1/auth/change-password", tenant.admin(),
                        Map.of("currentPassword", "not-the-password1", "newPassword", "Another2026secret")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("PASSWORD_CURRENT_INVALID"));
    }
}
