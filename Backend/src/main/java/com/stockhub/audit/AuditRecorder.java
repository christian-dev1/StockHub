package com.stockhub.audit;

/** Public API of the audit module. */
public interface AuditRecorder {

    /** Records the entry in the caller's transaction (committed or rolled back with it). */
    void record(AuditEntry entry);

    /**
     * Records the entry in its own transaction, so it survives a rollback of the
     * caller (e.g. failed login attempts, security incidents).
     */
    void recordIndependently(AuditEntry entry);
}
