package com.stockhub.supplier.presentation;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SupplierIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;

    @BeforeEach
    void setUp() throws Exception {
        tenant = api.newTenant("Sup");
    }

    @Test
    void generatesCodesAndEnforcesUniqueness() throws Exception {
        var first = api.create("/api/v1/suppliers", tenant.admin(), Map.of("name", "Brasseries", "leadTimeDays", 5));
        var second = api.create("/api/v1/suppliers", tenant.admin(), Map.of("name", "Laiterie"));
        assertThat(first.get("code").asString()).isEqualTo("SUP-0001");
        assertThat(second.get("code").asString()).isEqualTo("SUP-0002");

        mvc.perform(api.jsonPost("/api/v1/suppliers", tenant.admin(), Map.of("code", "sup-0001", "name", "Dup")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SUPPLIER_CODE_ALREADY_EXISTS"));
    }

    @Test
    void searchesAndFiltersByStatus() throws Exception {
        api.create("/api/v1/suppliers", tenant.admin(), Map.of("name", "Nestlé Cameroun", "city", "Douala"));
        var inactive = api.create("/api/v1/suppliers", tenant.admin(), Map.of("name", "Old Supplier"));
        mvc.perform(post("/api/v1/suppliers/" + inactive.get("id").asString() + "/deactivate")
                .header("Authorization", tenant.admin().bearer())).andExpect(status().isOk());

        assertThat(api.getJson("/api/v1/suppliers?q=douala", tenant.admin()).get("totalElements").asLong()).isEqualTo(1);
        assertThat(api.getJson("/api/v1/suppliers?active=false", tenant.admin()).get("totalElements").asLong()).isEqualTo(1);
        assertThat(api.getJson("/api/v1/suppliers?sort=name,desc", tenant.admin()).get("content").get(0).get("name").asString())
                .isEqualTo("Old Supplier");
    }

    @Test
    void storekeeperReadsButCannotWriteAndSellerCannotRead() throws Exception {
        Session storekeeper = api.userSession(tenant.admin(), "MAGASINIER", List.of());
        mvc.perform(get("/api/v1/suppliers").header("Authorization", storekeeper.bearer())).andExpect(status().isOk());
        mvc.perform(api.jsonPost("/api/v1/suppliers", storekeeper, Map.of("name", "X"))).andExpect(status().isForbidden());
        Session seller = api.userSession(tenant.admin(), "VENDEUR", List.of());
        mvc.perform(get("/api/v1/suppliers").header("Authorization", seller.bearer())).andExpect(status().isForbidden());
    }

    @Test
    void suppliersOfAnotherCompanyAreInvisible() throws Exception {
        var supplier = api.create("/api/v1/suppliers", tenant.admin(), Map.of("name", "Private"));
        TenantFixture other = api.newTenant("SupOther");
        mvc.perform(get("/api/v1/suppliers/" + supplier.get("id").asString()).header("Authorization", other.admin().bearer()))
                .andExpect(status().isNotFound());
        assertThat(api.getJson("/api/v1/suppliers", other.admin()).get("totalElements").asLong()).isZero();
    }
}
