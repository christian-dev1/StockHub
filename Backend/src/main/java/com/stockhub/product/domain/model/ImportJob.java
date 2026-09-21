package com.stockhub.product.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.ConflictException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * A previewed bulk import. It keeps the raw rows the user reviewed so that the
 * commit re-validates and applies exactly those rows, once, before expiry.
 */
public final class ImportJob {

    public static final Duration VALIDITY = Duration.ofHours(1);

    private final UUID id;
    private final UUID companyId;
    private final String fileName;
    private final List<Map<String, String>> rows;
    private final int errorRows;
    private final boolean createMissingCategories;
    private final UUID userId;
    private final Instant expiresAt;
    private ImportStatus status;
    private Instant committedAt;
    private final long version;

    public ImportJob(UUID id, UUID companyId, String fileName, List<Map<String, String>> rows, int errorRows,
                     boolean createMissingCategories, UUID userId, Instant expiresAt, ImportStatus status,
                     Instant committedAt, long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.fileName = Objects.requireNonNull(fileName);
        this.rows = List.copyOf(rows);
        this.errorRows = errorRows;
        this.createMissingCategories = createMissingCategories;
        this.userId = Objects.requireNonNull(userId);
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.status = Objects.requireNonNull(status);
        this.committedAt = committedAt;
        this.version = version;
    }

    public static ImportJob preview(UUID companyId, String fileName, List<Map<String, String>> rows, int errorRows,
                                    boolean createMissingCategories, UUID userId, Instant now) {
        return new ImportJob(Ids.newId(), companyId, fileName, rows, errorRows, createMissingCategories, userId,
                now.plus(VALIDITY), ImportStatus.PREVIEWED, null, 0);
    }

    public void commit(Instant now) {
        if (status == ImportStatus.COMMITTED) {
            throw new ConflictException("IMPORT_ALREADY_COMMITTED", "This import has already been applied.");
        }
        if (now.isAfter(expiresAt)) {
            throw new BusinessRuleViolationException("IMPORT_EXPIRED", "This preview has expired; upload the file again.");
        }
        status = ImportStatus.COMMITTED;
        committedAt = now;
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public String fileName() { return fileName; }
    public List<Map<String, String>> rows() { return rows; }
    public int totalRows() { return rows.size(); }
    public int errorRows() { return errorRows; }
    public boolean createMissingCategories() { return createMissingCategories; }
    public UUID userId() { return userId; }
    public Instant expiresAt() { return expiresAt; }
    public ImportStatus status() { return status; }
    public Instant committedAt() { return committedAt; }
    public long version() { return version; }
}
