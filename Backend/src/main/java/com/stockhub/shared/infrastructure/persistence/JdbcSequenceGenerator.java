package com.stockhub.shared.infrastructure.persistence;

import com.stockhub.shared.application.SequenceGenerator;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Atomic upsert on {@code document_sequences}; the row lock is held until the caller commits. */
@Component
class JdbcSequenceGenerator implements SequenceGenerator {

    private static final int NO_YEAR = 0;

    private final JdbcClient jdbc;

    JdbcSequenceGenerator(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public long next(UUID companyId, String sequence) {
        return next(companyId, sequence, NO_YEAR);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public long next(UUID companyId, String sequence, int year) {
        return jdbc.sql("""
                        INSERT INTO document_sequences (company_id, doc_type, year, last_value)
                        VALUES (:company, :type, :year, 1)
                        ON CONFLICT (company_id, doc_type, year)
                        DO UPDATE SET last_value = document_sequences.last_value + 1
                        RETURNING last_value""")
                .param("company", companyId)
                .param("type", sequence)
                .param("year", (short) year)
                .query(Long.class)
                .single();
    }
}
