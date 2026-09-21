package com.stockhub.user.domain.service;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.exception.UserErrors;
import java.util.EnumSet;
import java.util.Set;

/** Which roles an actor may grant. Nobody can grant SUPER_ADMIN through the API. */
public final class RoleAssignmentPolicy {

    private static final Set<RoleCode> COMPANY_ROLES =
            EnumSet.of(RoleCode.ADMIN, RoleCode.MANAGER, RoleCode.MAGASINIER, RoleCode.VENDEUR);

    private RoleAssignmentPolicy() {
    }

    public static void requireAssignable(RoleCode actorRole, RoleCode target) {
        boolean allowed = switch (actorRole) {
            case SUPER_ADMIN -> target == RoleCode.ADMIN;
            case ADMIN -> COMPANY_ROLES.contains(target);
            default -> false;
        };
        if (!allowed) {
            throw UserErrors.roleNotAssignable(target);
        }
    }
}
