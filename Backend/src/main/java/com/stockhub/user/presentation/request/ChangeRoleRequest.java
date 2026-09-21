package com.stockhub.user.presentation.request;

import com.stockhub.shared.security.RoleCode;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(@NotNull RoleCode role) {
}
