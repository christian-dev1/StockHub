package com.stockhub.user.domain.repository;

import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import java.util.Map;
import java.util.Set;

public interface RolePermissionRepository {

    Set<Permission> permissionsOf(RoleCode role);

    Map<RoleCode, Set<Permission>> matrix();
}
