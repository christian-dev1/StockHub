package com.stockhub.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** High-level helpers that drive the real API (login, onboarding, user creation). */
@TestComponent
public class ApiFixtures {

    public static final String SUPER_ADMIN_EMAIL = "superadmin@stockhub.test";
    public static final String SUPER_ADMIN_PASSWORD = "PlatformAdmin2026";
    public static final String PASSWORD = "Temporary2026pass";
    public static final String CHANGED_PASSWORD = "Definitive2026pass";

    private final MockMvc mvc;
    private final JsonMapper json;

    ApiFixtures(MockMvc mvc, JsonMapper json) {
        this.mvc = mvc;
        this.json = json;
    }

    public record Session(String accessToken, Cookie refreshCookie, JsonNode body) {
        public String bearer() {
            return "Bearer " + accessToken;
        }
    }

    public record TenantFixture(UUID companyId, UUID primaryLocationId, String adminEmail, Session admin) {
    }

    public Session login(String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn();
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        return new Session(body.get("accessToken").asString(), result.getResponse().getCookie("stockhub_refresh"), body);
    }

    public Session superAdmin() throws Exception {
        return login(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    }

    /** Onboards a company, then signs its admin in after replacing the temporary password. */
    public TenantFixture newTenant(String prefix) throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "admin-" + suffix + "@" + prefix.toLowerCase() + ".test";
        JsonNode created = onboard(prefix + " " + suffix, adminEmail);
        Session admin = activate(adminEmail);
        return new TenantFixture(UUID.fromString(created.at("/company/id").asString()),
                UUID.fromString(created.get("primaryLocationId").asString()), adminEmail, admin);
    }

    public JsonNode onboard(String companyName, String adminEmail) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/platform/companies").header("Authorization", superAdmin().bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(onboardingPayload(companyName, adminEmail))))
                .andExpect(status().isCreated()).andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    public Map<String, Object> onboardingPayload(String companyName, String adminEmail) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("profile", Map.of("name", companyName, "email", "contact@" + UUID.randomUUID() + ".test", "country", "CM"));
        payload.put("currency", "XAF");
        payload.put("timezone", "Africa/Douala");
        payload.put("locale", "fr");
        payload.put("admin", Map.of("email", adminEmail, "firstName", "Ada", "lastName", "Admin",
                "temporaryPassword", PASSWORD));
        return payload;
    }

    /** First login with the temporary password, mandatory change, then a fully privileged session. */
    public Session activate(String email) throws Exception {
        Session temporary = login(email, PASSWORD);
        mvc.perform(post("/api/v1/auth/change-password").header("Authorization", temporary.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("currentPassword", PASSWORD, "newPassword", CHANGED_PASSWORD))))
                .andExpect(status().isNoContent());
        return login(email, CHANGED_PASSWORD);
    }

    public UUID createUser(Session admin, String role, List<UUID> locationIds, String email) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("email", email);
        payload.put("firstName", "Test");
        payload.put("lastName", role);
        payload.put("role", role);
        payload.put("allLocations", locationIds.isEmpty());
        payload.put("locationIds", locationIds);
        payload.put("temporaryPassword", PASSWORD);
        MvcResult result = mvc.perform(post("/api/v1/users").header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(payload)))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(result.getResponse().getContentAsString()).get("id").asString());
    }

    public JsonNode getJson(String url, Session session) throws Exception {
        MvcResult result = mvc.perform(get(url).header("Authorization", session.bearer()))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    public MockHttpServletRequestBuilder jsonPost(String url, Session session, Object body) {
        return post(url).header("Authorization", session.bearer()).contentType(MediaType.APPLICATION_JSON).content(toJson(body));
    }

    public MockHttpServletRequestBuilder jsonPut(String url, Session session, Object body) {
        return put(url).header("Authorization", session.bearer()).contentType(MediaType.APPLICATION_JSON).content(toJson(body));
    }

    /** POSTs JSON and returns the parsed body, expecting 201 Created. */
    public JsonNode create(String url, Session session, Object body) throws Exception {
        return read(mvc.perform(jsonPost(url, session, body)).andExpect(status().isCreated()).andReturn());
    }

    /** Signs a new user of the given role in (temporary password already replaced). */
    public Session userSession(Session admin, String role, List<UUID> locationIds) throws Exception {
        String email = uniqueEmail(role.toLowerCase());
        createUser(admin, role, locationIds, email);
        return activate(email);
    }

    public String toJson(Object value) {
        return json.writeValueAsString(value);
    }

    public JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }

    public static String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@stockhub.test";
    }
}
