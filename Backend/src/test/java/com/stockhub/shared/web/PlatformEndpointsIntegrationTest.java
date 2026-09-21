package com.stockhub.shared.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockhub.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

class PlatformEndpointsIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void flywayBaselineIsApplied() {
        Integer tables = jdbc.queryForObject("""
                SELECT count(*) FROM information_schema.tables
                WHERE table_name IN ('document_sequences', 'event_publication')""", Integer.class);
        assertThat(tables).isEqualTo(2);
    }

    @Test
    void healthIsPublicAndUp() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void openApiDocumentIsPublic() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("StockHub API"));
    }

    @Test
    void protectedEndpointReturnsStructuredUnauthorized() throws Exception {
        mvc.perform(get("/api/v1/products").header("Accept-Language", "fr"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists(RequestIdFilter.HEADER))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Une authentification est requise pour accéder à cette ressource."))
                .andExpect(jsonPath("$.path").value("/api/v1/products"))
                .andExpect(jsonPath("$.requestId").isNotEmpty());
    }

    @Test
    void wellFormedIncomingRequestIdIsPropagated() throws Exception {
        mvc.perform(get("/actuator/health").header(RequestIdFilter.HEADER, "proxy-1234-abcd"))
                .andExpect(header().string(RequestIdFilter.HEADER, "proxy-1234-abcd"));
    }

    @Test
    void maliciousIncomingRequestIdIsReplaced() throws Exception {
        String header = mvc.perform(get("/actuator/health").header(RequestIdFilter.HEADER, "bad\nvalue"))
                .andReturn().getResponse().getHeader(RequestIdFilter.HEADER);
        assertThat(header).isNotEqualTo("bad\nvalue").matches("[0-9a-f-]{36}");
    }
}
