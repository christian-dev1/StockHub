package com.stockhub.supplier.presentation.request;

import com.stockhub.supplier.application.command.SupplierCommand;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** @param code optional on creation (generated), required on update */
public record SupplierRequest(
        @Size(max = 30) @Pattern(regexp = "^$|[A-Za-z0-9][A-Za-z0-9_-]*") String code,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 150) String contactName,
        @Email @Size(max = 254) String email,
        @Size(max = 40) String phone,
        @Size(max = 255) String addressLine,
        @Size(max = 100) String city,
        @Pattern(regexp = "^$|[A-Za-z]{2}") String country,
        @Size(max = 50) String taxId,
        @Min(0) @Max(365) Integer leadTimeDays,
        @Size(max = 1000) String notes) {

    public SupplierCommand toCommand() {
        return new SupplierCommand(code, name, contactName, email, phone, addressLine, city, country, taxId,
                leadTimeDays, notes);
    }
}
