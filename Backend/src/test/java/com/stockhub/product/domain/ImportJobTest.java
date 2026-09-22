package com.stockhub.product.domain;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.product.domain.model.ImportJob;
import com.stockhub.shared.domain.exception.DomainException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ImportJobTest {

    private static final Instant NOW = Instant.parse("2026-09-22T10:00:00Z");

    private static ImportJob job() {
        return ImportJob.preview(UUID.randomUUID(), "p.csv", List.of(Map.of("name", "A")), 0, false,
                UUID.randomUUID(), NOW);
    }

    @Test
    void aPreviewCanOnlyBeCommittedOnce() {
        ImportJob job = job();
        job.commit(NOW.plusSeconds(60));
        assertThatThrownBy(() -> job.commit(NOW.plusSeconds(120)))
                .isInstanceOf(DomainException.class).hasFieldOrPropertyWithValue("code", "IMPORT_ALREADY_COMMITTED");
    }

    @Test
    void anExpiredPreviewCannotBeCommitted() {
        ImportJob job = job();
        assertThatThrownBy(() -> job.commit(NOW.plus(ImportJob.VALIDITY).plusSeconds(1)))
                .isInstanceOf(DomainException.class).hasFieldOrPropertyWithValue("code", "IMPORT_EXPIRED");
    }
}
