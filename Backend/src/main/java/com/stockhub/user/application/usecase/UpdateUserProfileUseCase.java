package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.user.application.command.UpdateUserProfileCommand;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.valueobject.PersonName;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateUserProfileUseCase {

    private final CompanyUserAccess access;
    private final AuditRecorder audit;

    UpdateUserProfileUseCase(CompanyUserAccess access, AuditRecorder audit) {
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public UserView execute(UpdateUserProfileCommand command) {
        User user = access.load(command.userId());
        access.requireVersion(user, command.version());
        Map<String, Object> before = profile(user);
        user.updateProfile(new PersonName(command.firstName(), command.lastName()), command.phone());
        access.save(user);
        audit.record(AuditEntry.of("USER_UPDATED", "User", user.id()).change(before, profile(user)));
        return UserView.from(user);
    }

    private static Map<String, Object> profile(User user) {
        return Map.of("firstName", user.name().firstName(), "lastName", user.name().lastName(),
                "phone", user.phone() == null ? "" : user.phone());
    }
}
