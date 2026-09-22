package com.stockhub.auth.presentation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * A caller without the permission must get 403 even with an invalid body:
 * validation errors would otherwise disclose the form's constraints.
 */
class AuthorizationBeforeValidationIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;
    private Session seller;

    @BeforeEach
    void tenant() throws Exception {
        tenant = api.newTenant("Order");
        seller = api.userSession(tenant.admin(), "VENDEUR", List.of(tenant.primaryLocationId()));
    }

    @Test
    void sellerCreatingAUserWithAnInvalidBodyIsForbidden() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/users", seller, Map.of("email", "nope")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    @Test
    void sellerWithAnEmptyBodyIsForbiddenEverywhere() throws Exception {
        mvc.perform(api.jsonPut("/api/v1/company/settings", seller, Map.of()))
                .andExpect(status().isForbidden());
        mvc.perform(api.jsonPut("/api/v1/company", seller, Map.of()))
                .andExpect(status().isForbidden());
        mvc.perform(api.jsonPost("/api/v1/products", seller, Map.of()))
                .andExpect(status().isForbidden());
    }

    @Test
    void storekeeperCannotCreateUsersEvenWithAnInvalidBody() throws Exception {
        Session storekeeper = api.userSession(tenant.admin(), "MAGASINIER", List.of(tenant.primaryLocationId()));
        mvc.perform(api.jsonPost("/api/v1/users", storekeeper, Map.of("role", "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void companyAdminCannotOnboardCompaniesEvenWithAnInvalidBody() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/platform/companies", tenant.admin(), Map.of()))
                .andExpect(status().isForbidden());
    }

    @Test
    void authorizedCallersStillGetValidationErrors() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/users", tenant.admin(), Map.of("email", "nope")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        mvc.perform(api.jsonPost("/api/v1/platform/companies", api.superAdmin(), Map.of()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void anonymousCallersAreStillUnauthorized() throws Exception {
        mvc.perform(post("/api/v1/users")
                        .contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
