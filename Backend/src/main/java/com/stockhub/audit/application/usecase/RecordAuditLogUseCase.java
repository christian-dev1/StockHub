package com.stockhub.audit.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.audit.application.port.JsonSerializer;
import com.stockhub.audit.domain.model.AuditLog;
import com.stockhub.audit.domain.repository.AuditLogRepository;
import com.stockhub.shared.application.RequestMetadata;
import com.stockhub.shared.application.RequestMetadataProvider;
import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
class RecordAuditLogUseCase implements AuditRecorder {

    private final AuditLogRepository repository;
    private final CurrentUserProvider currentUser;
    private final RequestMetadataProvider requestMetadata;
    private final JsonSerializer json;
    private final Clock clock;

    RecordAuditLogUseCase(AuditLogRepository repository, CurrentUserProvider currentUser,
                          RequestMetadataProvider requestMetadata, JsonSerializer json, Clock clock) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.requestMetadata = requestMetadata;
        this.json = json;
        this.clock = clock;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AuditEntry entry) {
        repository.append(toLog(entry));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordIndependently(AuditEntry entry) {
        repository.append(toLog(entry));
    }

    private AuditLog toLog(AuditEntry entry) {
        Optional<CurrentUser> actor = currentUser.current();
        RequestMetadata request = requestMetadata.current();
        UUID companyId = entry.companyId() != null ? entry.companyId() : actor.map(CurrentUser::companyId).orElse(null);
        return new AuditLog(
                Ids.newId(),
                companyId,
                actor.map(CurrentUser::userId).orElse(null),
                actor.map(CurrentUser::email).orElse(null),
                entry.action(),
                entry.entityType(),
                entry.entityId(),
                entry.oldValue() == null ? null : json.toJson(entry.oldValue()),
                entry.newValue() == null ? null : json.toJson(entry.newValue()),
                entry.metadata() == null || entry.metadata().isEmpty() ? null : json.toJson(entry.metadata()),
                request.ipAddress(),
                request.userAgent(),
                request.requestId(),
                Instant.now(clock));
    }
}
