package com.stockhub.user.presentation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

/** A company must never see nor modify another company's data, and cannot even learn it exists. */
class TenantIsolationIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture alpha;
    private TenantFixture beta;
    private UUID betaUser;

    @BeforeEach
    void twoCompanies() throws Exception {
        alpha = api.newTenant("Alpha");
        beta = api.newTenant("Beta");
        betaUser = api.createUser(beta.admin(), "MANAGER", List.of(), ApiFixtures.uniqueEmail("beta-manager"));
    }

    @Test
    void usersOfAnotherCompanyAreNotFound() throws Exception {
        mvc.perform(get("/api/v1/users/" + betaUser).header("Authorization", alpha.admin().bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    void usersOfAnotherCompanyCannotBeModified() throws Exception {
        mvc.perform(put("/api/v1/users/" + betaUser).header("Authorization", alpha.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(api.toJson(Map.of("firstName", "Hacked", "lastName", "X", "version", 0))))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/users/" + betaUser + "/disable").header("Authorization", alpha.admin().bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/users/" + betaUser + "/role").header("Authorization", alpha.admin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(api.toJson(Map.of("role", "VENDEUR"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void listingOnlyReturnsOwnCompanyUsers() throws Exception {
        var page = api.getJson("/api/v1/users?size=100", alpha.admin());
        page.get("content").forEach(user ->
                org.assertj.core.api.Assertions.assertThat(user.get("id").asString()).isNotEqualTo(betaUser.toString()));
        org.assertj.core.api.Assertions.assertThat(page.get("totalElements").asLong()).isEqualTo(1);
    }

    @Test
    void locationsOfAnotherCompanyCannotBeAssigned() throws Exception {
        mvc.perform(api.jsonPost("/api/v1/users", alpha.admin(), Map.of(
                        "email", ApiFixtures.uniqueEmail("cross"), "firstName", "C", "lastName", "X", "role", "VENDEUR",
                        "allLocations", false, "locationIds", List.of(beta.primaryLocationId()),
                        "temporaryPassword", ApiFixtures.PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("USER_LOCATION_UNKNOWN"));
    }

    @Test
    void companyEndpointAlwaysResolvesTheTokenCompany() throws Exception {
        mvc.perform(get("/api/v1/company").param("companyId", beta.companyId().toString())
                        .header("Authorization", alpha.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alpha.companyId().toString()));
    }

    @Test
    void locationsListOnlyContainsOwnCompanyLocations() throws Exception {
        mvc.perform(get("/api/v1/locations").header("Authorization", alpha.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(alpha.primaryLocationId().toString()));
    }
}
