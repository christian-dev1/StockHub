package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.user.application.port.AuthorityCache;
import com.stockhub.user.application.port.PasswordHasher;
import com.stockhub.user.domain.exception.UserErrors;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.service.PasswordPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The authenticated user changes their password. All existing sessions,
 * including the current one, are invalidated; the client signs in again.
 */
@Service
public class ChangeOwnPasswordUseCase {

    private final UserRepository users;
    private final CurrentUserProvider currentUser;
    private final PasswordHasher hasher;
    private final AuthorityCache authorityCache;
    private final AuditRecorder audit;

    ChangeOwnPasswordUseCase(UserRepository users, CurrentUserProvider currentUser, PasswordHasher hasher,
                             AuthorityCache authorityCache, AuditRecorder audit) {
        this.users = users;
        this.currentUser = currentUser;
        this.hasher = hasher;
        this.authorityCache = authorityCache;
        this.audit = audit;
    }

    @Transactional
    public void execute(String currentPassword, String newPassword) {
        User user = users.findById(currentUser.require().userId())
                .orElseThrow(() -> UserErrors.notFound(currentUser.require().userId()));
        if (currentPassword == null || !hasher.matches(currentPassword, user.passwordHash())) {
            throw UserErrors.wrongCurrentPassword();
        }
        if (currentPassword.equals(newPassword)) {
            throw UserErrors.samePassword();
        }
        PasswordPolicy.validate(newPassword, user.email().value());
        user.changePassword(hasher.hash(newPassword));
        users.save(user);
        authorityCache.evict(user.id());
        audit.record(AuditEntry.of("USER_PASSWORD_CHANGED", "User", user.id()).inCompany(user.companyId()));
    }
}
