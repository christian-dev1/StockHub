package com.stockhub.user.presentation.request;

import com.stockhub.shared.security.RoleCode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public record CreateUserRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @Size(max = 40) String phone,
        @NotNull RoleCode role,
        Boolean allLocations,
        Set<UUID> locationIds,
        @NotBlank @Size(min = 10, max = 128) String temporaryPassword) {
}
