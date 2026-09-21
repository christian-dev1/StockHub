package com.stockhub.audit.domain.repository;

import com.stockhub.audit.domain.model.AuditLog;

public interface AuditLogRepository {

    void append(AuditLog log);
}
