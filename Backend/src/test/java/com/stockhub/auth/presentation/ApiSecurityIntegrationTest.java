package com.stockhub.auth.presentation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import com.stockhub.support.ApiFixtures;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import javax.crypto.spec.SecretKeySpec;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

class ApiSecurityIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    JwtEncoder encoder;

    private String token(JwtEncoder with, String subject, Instant expiresAt, int tokenVersion) {
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("stockhub").subject(subject)
                .issuedAt(expiresAt.minusSeconds(900)).expiresAt(expiresAt).claim("tv", tokenVersion).build();
        return with.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS512).build(), claims)).getTokenValue();
    }

    private String superAdminId() throws Exception {
        return api.superAdmin().body().at("/session/id").asString();
    }

    @Test
    void missingTokenIsUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void malformedTokenIsUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer not.a.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredTokenIsUnauthorized() throws Exception {
        String expired = token(encoder, superAdminId(), Instant.now().minusSeconds(120), 0);
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSignedWithAnotherKeyIsUnauthorized() throws Exception {
        byte[] otherKey = Base64.getDecoder().decode(
                "YW5vdGhlci1rZXktdGhhdC1pcy1sb25nLWVub3VnaC1mb3ItaHM1MTItYnV0LWlzLW5vdC10aGUtc2VydmVyLWtleQ==");
        JwtEncoder forger = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(otherKey, "HmacSHA512")));
        String forged = token(forger, superAdminId(), Instant.now().plusSeconds(600), 0);
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenForUnknownUserOrStaleVersionIsUnauthorized() throws Exception {
        String unknown = token(encoder, UUID.randomUUID().toString(), Instant.now().plusSeconds(600), 0);
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + unknown))
                .andExpect(status().isUnauthorized());
        String stale = token(encoder, superAdminId(), Instant.now().plusSeconds(600), 42);
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + stale))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void permissionsAreEnforcedPerRole() throws Exception {
        var tenant = api.newTenant("Perm");
        String sellerEmail = ApiFixtures.uniqueEmail("seller");
        api.createUser(tenant.admin(), "VENDEUR", List.of(tenant.primaryLocationId()), sellerEmail);
        var seller = api.activate(sellerEmail);

        mvc.perform(get("/api/v1/users").header("Authorization", seller.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(get("/api/v1/locations").header("Authorization", seller.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(tenant.primaryLocationId().toString()));
    }

    @Test
    void companyAdminCannotReachPlatformEndpoints() throws Exception {
        var tenant = api.newTenant("NoPlatform");
        mvc.perform(get("/api/v1/platform/companies").header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/platform/companies/" + tenant.companyId()).header("Authorization", tenant.admin().bearer()))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminHasNoCompanyContext() throws Exception {
        mvc.perform(get("/api/v1/users").header("Authorization", api.superAdmin().bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("COMPANY_CONTEXT_REQUIRED"));
    }
}
