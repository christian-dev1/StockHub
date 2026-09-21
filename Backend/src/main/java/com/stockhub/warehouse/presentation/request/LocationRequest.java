package com.stockhub.warehouse.presentation.request;

import com.stockhub.warehouse.application.command.LocationCommand;
import com.stockhub.warehouse.domain.model.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LocationRequest(
        @NotBlank @Size(max = 30) @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9_-]*") String code,
        @NotBlank @Size(max = 150) String name,
        @NotNull LocationType type,
        @Size(max = 255) String addressLine,
        @Size(max = 100) String city,
        @Size(max = 40) String phone) {

    public LocationCommand toCommand() {
        return new LocationCommand(code, name, type, addressLine, city, phone);
    }
}
