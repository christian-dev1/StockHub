package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.domain.model.User;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChangeUserStatusUseCase {

    private final CompanyUserAccess access;
    private final AuditRecorder audit;

    ChangeUserStatusUseCase(CompanyUserAccess access, AuditRecorder audit) {
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public UserView disable(UUID userId) {
        User user = access.load(userId);
        access.requireNotSelf(user);
        access.requireAnotherActiveAdmin(user);
        user.disable();
        access.save(user);
        audit.record(AuditEntry.of("USER_DISABLED", "User", user.id()));
        return UserView.from(user);
    }

    @Transactional
    public UserView activate(UUID userId) {
        User user = access.load(userId);
        user.activate();
        access.save(user);
        audit.record(AuditEntry.of("USER_ENABLED", "User", user.id()));
        return UserView.from(user);
    }
}
