package com.stockhub.user.application.dto;

import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import java.util.Set;

public record RoleView(RoleCode code, boolean platform, Set<Permission> permissions, boolean assignable) {
}
