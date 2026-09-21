package com.stockhub.product.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures.TenantFixture;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CategoryIntegrationTest extends AbstractIntegrationTest {

    private TenantFixture tenant;

    @BeforeEach
    void setUp() throws Exception {
        tenant = api.newTenant("Cat");
    }

    @Test
    void listsCategoriesAsATreeWithProductCounts() throws Exception {
        var drinks = api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Boissons"));
        String drinksId = drinks.get("id").asString();
        var waters = api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Eaux", "parentId", drinksId));
        api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Alimentation"));
        api.create("/api/v1/products", tenant.admin(), Map.of("name", "Source 1.5L", "unit", "UNIT",
                "categoryId", waters.get("id").asString()));

        var list = api.getJson("/api/v1/categories", tenant.admin());
        assertThat(list.size()).isEqualTo(3);
        assertThat(list.get(0).get("name").asString()).isEqualTo("Alimentation");
        assertThat(list.get(1).get("name").asString()).isEqualTo("Boissons");
        assertThat(list.get(2).get("name").asString()).isEqualTo("Eaux");
        assertThat(list.get(2).get("parentName").asString()).isEqualTo("Boissons");
        assertThat(list.get(2).get("productCount").asLong()).isEqualTo(1);
    }

    @Test
    void refusesThirdLevelAndDuplicateNames() throws Exception {
        var root = api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Hygiène"));
        var child = api.create("/api/v1/categories", tenant.admin(),
                Map.of("name", "Savons", "parentId", root.get("id").asString()));
        mvc.perform(api.jsonPost("/api/v1/categories", tenant.admin(),
                        Map.of("name", "Savons liquides", "parentId", child.get("id").asString())))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("CATEGORY_DEPTH_EXCEEDED"));
        mvc.perform(api.jsonPost("/api/v1/categories", tenant.admin(), Map.of("name", "hygiène")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CATEGORY_NAME_ALREADY_EXISTS"));
    }

    @Test
    void onlyEmptyCategoriesCanBeDeletedAndTheNameBecomesReusable() throws Exception {
        var used = api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Surgelés"));
        api.create("/api/v1/products", tenant.admin(), Map.of("name", "Glace", "unit", "UNIT",
                "categoryId", used.get("id").asString()));
        mvc.perform(delete("/api/v1/categories/" + used.get("id").asString()).header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("CATEGORY_IN_USE"));

        var empty = api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Temporaire"));
        mvc.perform(delete("/api/v1/categories/" + empty.get("id").asString()).header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isNoContent());
        api.create("/api/v1/categories", tenant.admin(), Map.of("name", "Temporaire"));
    }

    @Test
    void parentMustBelongToTheSameCompany() throws Exception {
        TenantFixture other = api.newTenant("CatOther");
        var foreign = api.create("/api/v1/categories", other.admin(), Map.of("name", "Étrangère"));
        mvc.perform(api.jsonPost("/api/v1/categories", tenant.admin(),
                        Map.of("name", "Fille", "parentId", foreign.get("id").asString())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CATEGORY_PARENT_UNKNOWN"));
    }
}
