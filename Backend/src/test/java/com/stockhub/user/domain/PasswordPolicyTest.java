package com.stockhub.user.domain;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.user.domain.service.PasswordPolicy;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

class PasswordPolicyTest {

    @ParameterizedTest
    @CsvSource({
            "short1, PASSWORD_LENGTH_INVALID",
            "onlyletterspassword, PASSWORD_TOO_WEAK",
            "1234567890123, PASSWORD_TOO_WEAK",
            "marie.dupont2026, PASSWORD_CONTAINS_EMAIL"
    })
    void rejectsWeakPasswords(String password, String code) {
        assertThatThrownBy(() -> PasswordPolicy.validate(password, "marie.dupont@shop.cm"))
                .extracting("code").isEqualTo(code);
    }

    @Test
    void acceptsStrongPassword() {
        assertThatCode(() -> PasswordPolicy.validate("Correct7Horse", "marie.dupont@shop.cm")).doesNotThrowAnyException();
    }
}
