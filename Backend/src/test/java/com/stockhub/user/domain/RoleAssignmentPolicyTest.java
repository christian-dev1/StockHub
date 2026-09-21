package com.stockhub.user.domain;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.service.RoleAssignmentPolicy;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class RoleAssignmentPolicyTest {

    @ParameterizedTest
    @CsvSource({
            "SUPER_ADMIN, ADMIN, true",
            "SUPER_ADMIN, VENDEUR, false",
            "ADMIN, ADMIN, true",
            "ADMIN, MANAGER, true",
            "ADMIN, VENDEUR, true",
            "ADMIN, SUPER_ADMIN, false",
            "MANAGER, VENDEUR, false",
            "VENDEUR, VENDEUR, false"
    })
    void enforcesWhoMayGrantWhichRole(RoleCode actor, RoleCode target, boolean allowed) {
        if (allowed) {
            assertThatCode(() -> RoleAssignmentPolicy.requireAssignable(actor, target)).doesNotThrowAnyException();
        } else {
            assertThatThrownBy(() -> RoleAssignmentPolicy.requireAssignable(actor, target))
                    .extracting("code").isEqualTo("USER_ROLE_NOT_ASSIGNABLE");
        }
    }
}
