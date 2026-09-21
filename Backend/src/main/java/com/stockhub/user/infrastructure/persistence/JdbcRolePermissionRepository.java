package com.stockhub.user.infrastructure.persistence;

import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.repository.RolePermissionRepository;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Reads the role → permission matrix. It is reference data versioned by
 * Flyway, so it is loaded once and kept in memory.
 */
@Repository
class JdbcRolePermissionRepository implements RolePermissionRepository {

    private final JdbcClient jdbc;
    private volatile Map<RoleCode, Set<Permission>> matrix;

    JdbcRolePermissionRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Set<Permission> permissionsOf(RoleCode role) {
        return matrix().getOrDefault(role, Set.of());
    }

    @Override
    public Map<RoleCode, Set<Permission>> matrix() {
        Map<RoleCode, Set<Permission>> current = matrix;
        if (current == null) {
            current = load();
            matrix = current;
        }
        return current;
    }

    private Map<RoleCode, Set<Permission>> load() {
        Map<RoleCode, Set<Permission>> result = new EnumMap<>(RoleCode.class);
        jdbc.sql("SELECT role_code, permission_code FROM role_permissions").query((rs, row) -> {
            result.computeIfAbsent(RoleCode.valueOf(rs.getString(1)), r -> EnumSet.noneOf(Permission.class))
                    .add(Permission.valueOf(rs.getString(2)));
            return null;
        }).list();
        result.replaceAll((role, permissions) -> Set.copyOf(permissions));
        return Map.copyOf(result);
    }
}
