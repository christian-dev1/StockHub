package com.stockhub.audit.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Immutable
@Table(name = "audit_logs")
class AuditLogJpaEntity {

    @Id
    UUID id;
    UUID companyId;
    UUID userId;
    String actorEmail;
    String action;
    String entityType;
    String entityId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    String oldValue;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    String newValue;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    String metadata;
    String ipAddress;
    String userAgent;
    String requestId;
    Instant occurredAt;

    protected AuditLogJpaEntity() {
    }
}
