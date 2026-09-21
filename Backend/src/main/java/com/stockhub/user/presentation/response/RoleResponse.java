package com.stockhub.user.presentation.response;

import com.stockhub.shared.security.Permission;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.application.dto.RoleView;
import java.util.List;

public record RoleResponse(RoleCode code, boolean platform, boolean assignable, List<Permission> permissions) {

    public static RoleResponse from(RoleView view) {
        return new RoleResponse(view.code(), view.platform(), view.assignable(),
                view.permissions().stream().sorted().toList());
    }
}
