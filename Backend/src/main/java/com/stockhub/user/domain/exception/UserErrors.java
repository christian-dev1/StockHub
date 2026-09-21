package com.stockhub.user.domain.exception;

import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.ConflictException;
import com.stockhub.shared.domain.exception.ForbiddenException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.domain.exception.ResourceNotFoundException;
import com.stockhub.shared.domain.exception.UnauthorizedException;
import java.util.UUID;

/** Factory of the user module's business errors (stable codes for the frontends). */
public final class UserErrors {

    private UserErrors() {
    }

    public static ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("User", id);
    }

    public static ConflictException emailAlreadyUsed() {
        return new ConflictException("USER_EMAIL_ALREADY_EXISTS", "A user with this email already exists.");
    }

    public static ForbiddenException roleNotAssignable(Object role) {
        return new ForbiddenException("USER_ROLE_NOT_ASSIGNABLE", "You cannot assign the role " + role + ".", role);
    }

    public static BusinessRuleViolationException cannotChangeOwnAccount() {
        return new BusinessRuleViolationException("USER_CANNOT_CHANGE_OWN_ACCESS",
                "You cannot disable your own account or change your own role.");
    }

    public static BusinessRuleViolationException lastAdmin() {
        return new BusinessRuleViolationException("USER_LAST_ADMIN",
                "The company must keep at least one active administrator.");
    }

    public static InvalidInputException unknownLocations() {
        return new InvalidInputException("locationIds", "USER_LOCATION_UNKNOWN",
                "One or more locations do not exist or are inactive.");
    }

    public static UnauthorizedException wrongCurrentPassword() {
        return new UnauthorizedException("PASSWORD_CURRENT_INVALID", "The current password is incorrect.");
    }

    public static BusinessRuleViolationException samePassword() {
        return new BusinessRuleViolationException("PASSWORD_UNCHANGED", "The new password must differ from the current one.");
    }
}
