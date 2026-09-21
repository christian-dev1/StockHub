package com.stockhub.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles({"test", "demo"})
class DemoDataIntegrationTest extends AbstractIntegrationTest {

    @Test
    void everyDemoRoleCanSignInWithoutPasswordChange() throws Exception {
        for (String role : new String[] {"admin", "manager", "magasinier", "vendeur"}) {
            var session = api.login(role + "@alpha.cm", DemoDataInitializer.PASSWORD);
            mvc.perform(get("/api/v1/auth/me").header("Authorization", session.bearer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.mustChangePassword").value(false))
                    .andExpect(jsonPath("$.company.name").value("Alpha Market"));
        }
    }

    @Test
    void demoCompaniesAreIsolated() throws Exception {
        var alpha = api.login("admin@alpha.cm", DemoDataInitializer.PASSWORD);
        mvc.perform(get("/api/v1/users").param("size", "50").header("Authorization", alpha.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.content[?(@.email =~ /.*beta.cm/)]").isEmpty());
    }
}
