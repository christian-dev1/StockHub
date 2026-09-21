package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.service.RoleAssignmentPolicy;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChangeUserRoleUseCase {

    private final CompanyUserAccess access;
    private final AuditRecorder audit;

    ChangeUserRoleUseCase(CompanyUserAccess access, AuditRecorder audit) {
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public UserView execute(UUID userId, RoleCode newRole) {
        User user = access.load(userId);
        access.requireNotSelf(user);
        RoleAssignmentPolicy.requireAssignable(access.actor().role(), newRole);
        RoleCode previous = user.role();
        if (previous == newRole) {
            return UserView.from(user);
        }
        if (previous == RoleCode.ADMIN) {
            access.requireAnotherActiveAdmin(user);
        }
        user.changeRole(newRole);
        access.save(user);
        audit.record(AuditEntry.of("USER_ROLE_CHANGED", "User", user.id())
                .change(Map.of("role", previous), Map.of("role", newRole)));
        return UserView.from(user);
    }
}
