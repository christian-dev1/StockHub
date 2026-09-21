package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.UserProvisioning;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.application.port.PasswordHasher;
import com.stockhub.user.domain.exception.UserErrors;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.service.PasswordPolicy;
import com.stockhub.user.domain.valueobject.Email;
import com.stockhub.user.domain.valueobject.LocationAssignment;
import com.stockhub.user.domain.valueobject.PersonName;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
class UserProvisioningService implements UserProvisioning {

    private static final Logger log = LoggerFactory.getLogger(UserProvisioningService.class);

    private final UserRepository users;
    private final PasswordHasher hasher;
    private final AuditRecorder audit;

    UserProvisioningService(UserRepository users, PasswordHasher hasher, AuditRecorder audit) {
        this.users = users;
        this.hasher = hasher;
        this.audit = audit;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID createCompanyAdmin(UUID companyId, String email, String firstName, String lastName,
                                   String temporaryPassword) {
        return provisionUser(companyId, email, firstName, lastName, RoleCode.ADMIN, true, Set.of(),
                temporaryPassword, true);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID provisionUser(UUID companyId, String email, String firstName, String lastName, RoleCode role,
                              boolean allLocations, Set<UUID> locationIds, String password, boolean temporary) {
        Email address = new Email(email);
        PasswordPolicy.validate(password, address.value());
        if (users.existsByEmail(address)) {
            throw UserErrors.emailAlreadyUsed();
        }
        User user = User.newCompanyUser(companyId, address, new PersonName(firstName, lastName), null, role,
                new LocationAssignment(allLocations, locationIds), hasher.hash(password));
        if (!temporary) {
            user.changePassword(user.passwordHash());
        }
        users.save(user);
        audit.record(AuditEntry.of("USER_CREATED", "User", user.id()).inCompany(companyId)
                .change(null, UserView.from(user).auditSnapshot()));
        return user.id();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean exists(String email) {
        return users.existsByEmail(new Email(email));
    }

    @Override
    @Transactional
    public void ensureSuperAdmin(String email, String firstName, String lastName, String password) {
        Email address = new Email(email);
        if (users.existsByEmail(address)) {
            return;
        }
        PasswordPolicy.validate(password, address.value());
        User superAdmin = User.newSuperAdmin(address, new PersonName(firstName, lastName), hasher.hash(password));
        users.save(superAdmin);
        audit.record(AuditEntry.of("SUPER_ADMIN_BOOTSTRAPPED", "User", superAdmin.id()));
        log.info("Platform super admin account created for {}", address.value());
    }
}
