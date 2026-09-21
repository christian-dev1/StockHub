package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.user.application.command.CreateUserCommand;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.application.port.PasswordHasher;
import com.stockhub.user.domain.exception.UserErrors;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.service.PasswordPolicy;
import com.stockhub.user.domain.service.RoleAssignmentPolicy;
import com.stockhub.user.domain.valueobject.Email;
import com.stockhub.user.domain.valueobject.PersonName;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateUserUseCase {

    private final UserRepository users;
    private final CompanyUserAccess access;
    private final PasswordHasher hasher;
    private final AuditRecorder audit;

    CreateUserUseCase(UserRepository users, CompanyUserAccess access, PasswordHasher hasher, AuditRecorder audit) {
        this.users = users;
        this.access = access;
        this.hasher = hasher;
        this.audit = audit;
    }

    @Transactional
    public UserView execute(CreateUserCommand command) {
        CurrentUser actor = access.actor();
        UUID companyId = actor.requireCompanyId();
        RoleAssignmentPolicy.requireAssignable(actor.role(), command.role());
        Email email = new Email(command.email());
        PasswordPolicy.validate(command.temporaryPassword(), email.value());
        if (users.existsByEmail(email)) {
            throw UserErrors.emailAlreadyUsed();
        }
        User user = User.newCompanyUser(companyId, email, new PersonName(command.firstName(), command.lastName()),
                command.phone(), command.role(),
                access.validatedAssignment(companyId, command.allLocations(), command.locationIds()),
                hasher.hash(command.temporaryPassword()));
        access.save(user);
        UserView view = UserView.from(user);
        audit.record(AuditEntry.of("USER_CREATED", "User", user.id()).change(null, view.auditSnapshot()));
        return view;
    }
}
