package com.stockhub.audit.infrastructure.persistence;

import com.stockhub.audit.domain.model.AuditLog;
import com.stockhub.audit.domain.repository.AuditLogRepository;
import org.springframework.stereotype.Repository;

@Repository
class JpaAuditLogRepository implements AuditLogRepository {

    private final AuditLogJpaRepository jpa;

    JpaAuditLogRepository(AuditLogJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void append(AuditLog log) {
        AuditLogJpaEntity entity = new AuditLogJpaEntity();
        entity.id = log.id();
        entity.companyId = log.companyId();
        entity.userId = log.userId();
        entity.actorEmail = log.actorEmail();
        entity.action = log.action();
        entity.entityType = log.entityType();
        entity.entityId = log.entityId();
        entity.oldValue = log.oldValueJson();
        entity.newValue = log.newValueJson();
        entity.metadata = log.metadataJson();
        entity.ipAddress = log.ipAddress();
        entity.userAgent = log.userAgent();
        entity.requestId = log.requestId();
        entity.occurredAt = log.occurredAt();
        jpa.save(entity);
    }
}
