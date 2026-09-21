package com.stockhub.audit;

import java.util.Map;
import java.util.UUID;

/**
 * Describes an auditable action. The actor, IP address and request id are
 * captured automatically by the recorder.
 *
 * @param companyId company concerned; defaults to the actor's company when null
 * @param oldValue  state before the change (serialized as JSON), if relevant
 * @param newValue  state after the change (serialized as JSON), if relevant
 */
public record AuditEntry(
        String action,
        String entityType,
        String entityId,
        UUID companyId,
        Object oldValue,
        Object newValue,
        Map<String, Object> metadata) {

    public static AuditEntry of(String action, String entityType, Object entityId) {
        return new AuditEntry(action, entityType, entityId == null ? null : entityId.toString(), null, null, null, Map.of());
    }

    public AuditEntry inCompany(UUID company) {
        return new AuditEntry(action, entityType, entityId, company, oldValue, newValue, metadata);
    }

    public AuditEntry change(Object before, Object after) {
        return new AuditEntry(action, entityType, entityId, companyId, before, after, metadata);
    }

    public AuditEntry withMetadata(Map<String, Object> values) {
        return new AuditEntry(action, entityType, entityId, companyId, oldValue, newValue, Map.copyOf(values));
    }
}
