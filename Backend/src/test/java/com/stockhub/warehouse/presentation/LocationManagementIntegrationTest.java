package com.stockhub.warehouse.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.Session;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LocationManagementIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;

    @BeforeEach
    void setUp() throws Exception {
        tenant = api.newTenant("Loc");
    }

    private UUID createLocation(String code, String type) throws Exception {
        var body = api.create("/api/v1/locations", tenant.admin(),
                Map.of("code", code, "name", "Site " + code, "type", type, "city", "Douala"));
        return UUID.fromString(body.get("id").asString());
    }

    @Test
    void createsLocationsWithUniqueCodesPerCompany() throws Exception {
        UUID warehouse = createLocation("wh-1", "WAREHOUSE");
        var created = api.getJson("/api/v1/locations/" + warehouse, tenant.admin());
        assertThat(created.get("code").asString()).isEqualTo("WH-1");
        assertThat(created.get("primary").asBoolean()).isFalse();

        mvc.perform(api.jsonPost("/api/v1/locations", tenant.admin(), Map.of("code", "WH-1", "name", "Dup", "type", "DEPOT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LOCATION_CODE_ALREADY_EXISTS"));

        TenantFixture other = api.newTenant("LocOther");
        api.create("/api/v1/locations", other.admin(), Map.of("code", "WH-1", "name", "Same code", "type", "DEPOT"));
    }

    @Test
    void movesThePrimaryFlagAtomically() throws Exception {
        UUID store = createLocation("store-2", "STORE");
        mvc.perform(post("/api/v1/locations/" + store + "/set-primary").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primary").value(true));
        var locations = api.getJson("/api/v1/locations", tenant.admin());
        long primaries = 0;
        for (var location : locations) {
            if (location.get("primary").asBoolean()) {
                primaries++;
                assertThat(location.get("id").asString()).isEqualTo(store.toString());
            }
        }
        assertThat(primaries).isEqualTo(1);
    }

    @Test
    void primaryLocationCannotBeDeactivatedButOthersCan() throws Exception {
        mvc.perform(post("/api/v1/locations/" + tenant.primaryLocationId() + "/deactivate")
                        .header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("LOCATION_PRIMARY_CANNOT_BE_DISABLED"));

        UUID depot = createLocation("dep-3", "DEPOT");
        mvc.perform(post("/api/v1/locations/" + depot + "/deactivate").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
        assertThat(api.getJson("/api/v1/locations", tenant.admin()).size()).isEqualTo(1);
        assertThat(api.getJson("/api/v1/locations?includeInactive=true", tenant.admin()).size()).isEqualTo(2);
    }

    @Test
    void staleVersionIsRejected() throws Exception {
        UUID depot = createLocation("dep-4", "DEPOT");
        var update = Map.of("location", Map.of("code", "DEP-4", "name", "Renamed", "type", "DEPOT"), "version", 0);
        mvc.perform(api.jsonPut("/api/v1/locations/" + depot, tenant.admin(), update)).andExpect(status().isOk());
        mvc.perform(api.jsonPut("/api/v1/locations/" + depot, tenant.admin(), update))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENT_MODIFICATION"));
    }

    @Test
    void usersOnlySeeTheLocationsTheyAreGranted() throws Exception {
        UUID warehouse = createLocation("wh-5", "WAREHOUSE");
        Session storekeeper = api.userSession(tenant.admin(), "MAGASINIER", List.of(warehouse));
        var visible = api.getJson("/api/v1/locations", storekeeper);
        assertThat(visible.size()).isEqualTo(1);
        assertThat(visible.get(0).get("id").asString()).isEqualTo(warehouse.toString());
        mvc.perform(get("/api/v1/locations/" + tenant.primaryLocationId()).header("Authorization", storekeeper.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LOCATION_ACCESS_DENIED"));
        mvc.perform(api.jsonPost("/api/v1/locations", storekeeper, Map.of("code", "X", "name", "X", "type", "DEPOT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void locationsOfAnotherCompanyDoNotExist() throws Exception {
        TenantFixture other = api.newTenant("LocIntruder");
        mvc.perform(get("/api/v1/locations/" + tenant.primaryLocationId()).header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/locations/" + tenant.primaryLocationId() + "/set-primary")
                        .header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
    }
}
