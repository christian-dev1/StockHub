package com.stockhub.audit.domain.model;

import java.time.Instant;
import java.util.UUID;

/** An immutable audit record. Values are pre-serialized JSON documents. */
public record AuditLog(
        UUID id,
        UUID companyId,
        UUID userId,
        String actorEmail,
        String action,
        String entityType,
        String entityId,
        String oldValueJson,
        String newValueJson,
        String metadataJson,
        String ipAddress,
        String userAgent,
        String requestId,
        Instant occurredAt) {
}
