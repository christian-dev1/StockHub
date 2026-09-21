package com.stockhub.user.application.usecase;

import com.stockhub.audit.AuditEntry;
import com.stockhub.audit.AuditRecorder;
import com.stockhub.user.application.command.AssignLocationsCommand;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.domain.model.User;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignUserLocationsUseCase {

    private final CompanyUserAccess access;
    private final AuditRecorder audit;

    AssignUserLocationsUseCase(CompanyUserAccess access, AuditRecorder audit) {
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public UserView execute(AssignLocationsCommand command) {
        User user = access.load(command.userId());
        Map<String, Object> before = Map.of("allLocations", user.allLocations(), "locationIds", user.locationIds());
        user.assignLocations(access.validatedAssignment(user.companyId(), command.allLocations(), command.locationIds()));
        access.save(user);
        audit.record(AuditEntry.of("USER_LOCATIONS_CHANGED", "User", user.id())
                .change(before, Map.of("allLocations", user.allLocations(), "locationIds", user.locationIds())));
        return UserView.from(user);
    }
}
