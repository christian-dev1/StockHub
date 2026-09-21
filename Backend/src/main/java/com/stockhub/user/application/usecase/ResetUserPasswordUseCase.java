package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.user.application.port.PasswordHasher;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.service.PasswordPolicy;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** An administrator sets a temporary password; the user must change it at next login. */
@Service
public class ResetUserPasswordUseCase {

    private final CompanyUserAccess access;
    private final PasswordHasher hasher;
    private final AuditRecorder audit;

    ResetUserPasswordUseCase(CompanyUserAccess access, PasswordHasher hasher, AuditRecorder audit) {
        this.access = access;
        this.hasher = hasher;
        this.audit = audit;
    }

    @Transactional
    public void execute(UUID userId, String temporaryPassword) {
        User user = access.load(userId);
        access.requireNotSelf(user);
        PasswordPolicy.validate(temporaryPassword, user.email().value());
        user.resetPassword(hasher.hash(temporaryPassword));
        access.save(user);
        audit.record(AuditEntry.of("USER_PASSWORD_RESET", "User", user.id()));
    }
}
