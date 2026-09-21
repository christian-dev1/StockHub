package com.stockhub.user.application.usecase;

import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.user.application.port.AuthorityCache;
import com.stockhub.user.domain.exception.UserErrors;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.valueobject.LocationAssignment;
import com.stockhub.warehouse.LocationApi;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

/** Shared steps of user administration use cases: tenant-scoped loading, guards, persistence. */
@Component
class CompanyUserAccess {

    private final UserRepository users;
    private final CurrentUserProvider currentUser;
    private final LocationApi locationApi;
    private final AuthorityCache authorityCache;

    CompanyUserAccess(UserRepository users, CurrentUserProvider currentUser, LocationApi locationApi,
                      AuthorityCache authorityCache) {
        this.users = users;
        this.currentUser = currentUser;
        this.locationApi = locationApi;
        this.authorityCache = authorityCache;
    }

    CurrentUser actor() {
        return currentUser.require();
    }

    /** Loads a user of the actor's company; other companies' users do not exist (404). */
    User load(UUID userId) {
        return users.findInCompany(actor().requireCompanyId(), userId).orElseThrow(() -> UserErrors.notFound(userId));
    }

    void requireVersion(User user, long expectedVersion) {
        if (user.version() != expectedVersion) {
            throw new OptimisticLockingFailureException("User " + user.id() + " was modified concurrently");
        }
    }

    void requireNotSelf(User user) {
        if (user.id().equals(actor().userId())) {
            throw UserErrors.cannotChangeOwnAccount();
        }
    }

    /** Refuses changes that would leave the company without an active administrator. */
    void requireAnotherActiveAdmin(User user) {
        if (user.isActiveAdmin() && users.countActiveAdmins(user.companyId()) <= 1) {
            throw UserErrors.lastAdmin();
        }
    }

    LocationAssignment validatedAssignment(UUID companyId, boolean all, java.util.Set<UUID> locationIds) {
        LocationAssignment assignment = new LocationAssignment(all, locationIds);
        if (!assignment.allLocations()
                && locationApi.findActiveIds(companyId, assignment.locationIds()).size() != assignment.locationIds().size()) {
            throw UserErrors.unknownLocations();
        }
        return assignment;
    }

    void save(User user) {
        users.save(user);
        authorityCache.evict(user.id());
    }

    static void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(field, "FIELD_REQUIRED", field + " is required.");
        }
    }
}
