package com.stockhub.user.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.shared.domain.exception.DomainException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.model.UserStatus;
import com.stockhub.user.domain.valueobject.Email;
import com.stockhub.user.domain.valueobject.LocationAssignment;
import com.stockhub.user.domain.valueobject.PersonName;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UserTest {

    private final UUID companyId = UUID.randomUUID();
    private final UUID storeId = UUID.randomUUID();

    private User seller() {
        return User.newCompanyUser(companyId, new Email("  Seller@Shop.CM "), new PersonName("Sam", "Seller"), null,
                RoleCode.VENDEUR, new LocationAssignment(false, Set.of(storeId)), "hash");
    }

    @Test
    void newCompanyUserMustChangeTemporaryPasswordAndHasNormalizedEmail() {
        User user = seller();
        assertThat(user.email().value()).isEqualTo("seller@shop.cm");
        assertThat(user.mustChangePassword()).isTrue();
        assertThat(user.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.locationIds()).containsExactly(storeId);
    }

    @Test
    void superAdminCannotBeCreatedAsCompanyUser() {
        assertThatThrownBy(() -> User.newCompanyUser(companyId, new Email("x@y.cm"), new PersonName("A", "B"), null,
                RoleCode.SUPER_ADMIN, LocationAssignment.ALL, "hash"))
                .isInstanceOf(DomainException.class)
                .extracting("code").isEqualTo("USER_ROLE_NOT_ASSIGNABLE");
    }

    @Test
    void adminAlwaysHasAccessToAllLocations() {
        User user = seller();
        user.changeRole(RoleCode.ADMIN);
        assertThat(user.allLocations()).isTrue();
        user.assignLocations(new LocationAssignment(false, Set.of(storeId)));
        assertThat(user.allLocations()).isTrue();
    }

    @Test
    void disablingAndPasswordChangesInvalidateIssuedTokens() {
        User user = seller();
        int initial = user.tokenVersion();
        user.changePassword("new-hash");
        assertThat(user.mustChangePassword()).isFalse();
        user.disable();
        user.disable();
        assertThat(user.tokenVersion()).isEqualTo(initial + 2);
        user.resetPassword("temp");
        assertThat(user.mustChangePassword()).isTrue();
        assertThat(user.tokenVersion()).isEqualTo(initial + 3);
    }

    @Test
    void restrictedUserNeedsAtLeastOneLocation() {
        assertThatThrownBy(() -> new LocationAssignment(false, Set.of()))
                .isInstanceOf(InvalidInputException.class)
                .extracting("code").isEqualTo("USER_LOCATIONS_REQUIRED");
    }

    @Test
    void rejectsInvalidEmails() {
        assertThatThrownBy(() -> new Email("not-an-email")).extracting("code").isEqualTo("USER_EMAIL_INVALID");
        assertThatThrownBy(() -> new Email(" ")).extracting("code").isEqualTo("USER_EMAIL_REQUIRED");
    }
}
