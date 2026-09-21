package com.stockhub.shared;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.support.AbstractIntegrationTest;
import java.util.Arrays;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

class ReferenceDataIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void permissionEnumMatchesTheDatabase() {
        var inDatabase = jdbc.queryForList("SELECT code FROM permissions", String.class);
        assertThat(inDatabase).containsExactlyInAnyOrderElementsOf(Arrays.stream(Permission.values()).map(Enum::name).toList());
    }

    @Test
    void roleEnumMatchesTheDatabase() {
        var inDatabase = jdbc.queryForList("SELECT code FROM roles", String.class);
        assertThat(inDatabase).containsExactlyInAnyOrderElementsOf(Arrays.stream(RoleCode.values()).map(Enum::name).toList());
    }

    @Test
    void sellersCanNeverAdjustStockOrManageUsers() {
        var sellerPermissions = jdbc.queryForList(
                "SELECT permission_code FROM role_permissions WHERE role_code = 'VENDEUR'", String.class);
        assertThat(sellerPermissions).doesNotContain("STOCK_ENTRY", "STOCK_EXIT", "STOCK_ADJUST", "USER_CREATE");
    }

    @Test
    void auditLogIsAppendOnly() {
        jdbc.update("INSERT INTO audit_logs (id, action, entity_type) VALUES (?, 'TEST', 'Test')", UUID.randomUUID());
        assertThatThrownBy(() -> jdbc.update("UPDATE audit_logs SET action = 'TAMPERED' WHERE action = 'TEST'"))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("append-only");
        assertThatThrownBy(() -> jdbc.update("DELETE FROM audit_logs WHERE action = 'TEST'"))
                .isInstanceOf(DataAccessException.class);
    }
}
