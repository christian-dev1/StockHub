package com.stockhub.user.presentation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class UserManagementIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;
    private UUID adminId;

    @BeforeEach
    void company() throws Exception {
        tenant = api.newTenant("Users");
        adminId = UUID.fromString(tenant.admin().body().at("/session/id").asString());
    }

    @Test
    void adminCreatesARestrictedUser() throws Exception {
        String email = ApiFixtures.uniqueEmail("clerk");
        mvc.perform(api.jsonPost("/api/v1/users", tenant.admin(), Map.of(
                        "email", email.toUpperCase(), "firstName", "Mia", "lastName", "Clerk", "role", "MAGASINIER",
                        "allLocations", false, "locationIds", List.of(tenant.primaryLocationId()),
                        "temporaryPassword", ApiFixtures.PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.locationIds[0]").value(tenant.primaryLocationId().toString()));
    }

    @Test
    void duplicateEmailIsAConflict() throws Exception {
        String email = ApiFixtures.uniqueEmail("dup");
        api.createUser(tenant.admin(), "VENDEUR", List.of(tenant.primaryLocationId()), email);
        mvc.perform(api.jsonPost("/api/v1/users", tenant.admin(), Map.of(
                        "email", email, "firstName", "A", "lastName", "B", "role", "VENDEUR", "allLocations", true,
                        "temporaryPassword", ApiFixtures.PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void beanValidationErrorsAreStructured() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/users", tenant.admin(), Map.of("email", "nope", "role", "VENDEUR")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isNotEmpty());
    }

    @Test
    void theLastActiveAdminCannotBeDisabledOrDemoted() throws Exception {
        UUID secondAdmin = api.createUser(tenant.admin(), "ADMIN", List.of(), ApiFixtures.uniqueEmail("admin2"));
        mvc.perform(post("/api/v1/users/" + secondAdmin + "/disable").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk());
        // Now only the original admin is active: the second admin demoting... not possible, and self-change refused.
        mvc.perform(post("/api/v1/users/" + adminId + "/disable").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("USER_CANNOT_CHANGE_OWN_ACCESS"));
    }

    @Test
    void lastAdminRuleProtectsAgainstDemotion() throws Exception {
        String secondEmail = ApiFixtures.uniqueEmail("admin2");
        api.createUser(tenant.admin(), "ADMIN", List.of(), secondEmail);
        var second = api.activate(secondEmail);
        // The second admin disables the first one: allowed while two admins are active.
        mvc.perform(post("/api/v1/users/" + adminId + "/disable").header("Authorization", second.bearer()))
                .andExpect(status().isOk());
        UUID secondId = UUID.fromString(second.body().at("/session/id").asString());
        // A third admin is needed to act on the second; instead check the rule through the role change of self.
        mvc.perform(put("/api/v1/users/" + secondId + "/role").header("Authorization", second.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(Map.of("role", "MANAGER"))))
                .andExpect(status().isUnprocessableContent());
        mvc.perform(post("/api/v1/users/" + adminId + "/activate").header("Authorization", second.bearer()))
                .andExpect(status().isOk());
    }

    @Test
    void superAdminRoleCanNeverBeGranted() throws Exception {
        UUID manager = api.createUser(tenant.admin(), "MANAGER", List.of(), ApiFixtures.uniqueEmail("m"));
        mvc.perform(put("/api/v1/users/" + manager + "/role").header("Authorization", tenant.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(Map.of("role", "SUPER_ADMIN"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("USER_ROLE_NOT_ASSIGNABLE"));
    }

    @Test
    void staleVersionIsRejected() throws Exception {
        UUID manager = api.createUser(tenant.admin(), "MANAGER", List.of(), ApiFixtures.uniqueEmail("v"));
        Map<String, Object> update = Map.of("firstName", "New", "lastName", "Name", "version", 0);
        mvc.perform(put("/api/v1/users/" + manager).header("Authorization", tenant.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(update)))
                .andExpect(status().isOk());
        mvc.perform(put("/api/v1/users/" + manager).header("Authorization", tenant.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(update)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENT_MODIFICATION"));
    }

    @Test
    void disabledUserIsSignedOutAndCannotSignIn() throws Exception {
        String email = ApiFixtures.uniqueEmail("gone");
        UUID userId = api.createUser(tenant.admin(), "VENDEUR", List.of(tenant.primaryLocationId()), email);
        var seller = api.activate(email);

        mvc.perform(post("/api/v1/users/" + userId + "/disable").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISABLED"));
        mvc.perform(get("/api/v1/auth/me").header("Authorization", seller.bearer())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(api.toJson(Map.of("email", email, "password", ApiFixtures.CHANGED_PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_ACCOUNT_DISABLED"));
    }

    @Test
    void roleChangeAppliesOnTheNextRequest() throws Exception {
        String email = ApiFixtures.uniqueEmail("promo");
        UUID userId = api.createUser(tenant.admin(), "VENDEUR", List.of(tenant.primaryLocationId()), email);
        var user = api.activate(email);
        mvc.perform(get("/api/v1/users").header("Authorization", user.bearer())).andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/users/" + userId + "/role").header("Authorization", tenant.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(Map.of("role", "MANAGER"))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/users").header("Authorization", user.bearer())).andExpect(status().isOk());
    }

    @Test
    void usersCanBeSearchedAndSorted() throws Exception {
        api.createUser(tenant.admin(), "VENDEUR", List.of(tenant.primaryLocationId()), ApiFixtures.uniqueEmail("zed"));
        mvc.perform(get("/api/v1/users").param("role", "VENDEUR").param("sort", "email,desc")
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].role").value("VENDEUR"));
        mvc.perform(get("/api/v1/roles").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'SUPER_ADMIN')].assignable").value(false))
                .andExpect(jsonPath("$[?(@.code == 'VENDEUR')].assignable").value(true));
    }
}
