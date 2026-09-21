package com.stockhub.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Base class for tests running against a real PostgreSQL through Testcontainers.
 * The context (and database) is shared, so tests create uniquely named data.
 */
@SpringBootTest(properties = {
        "stockhub.bootstrap.super-admin.email=" + ApiFixtures.SUPER_ADMIN_EMAIL,
        "stockhub.bootstrap.super-admin.password=" + ApiFixtures.SUPER_ADMIN_PASSWORD
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestcontainersConfiguration.class, ApiFixtures.class})
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ApiFixtures api;
}
