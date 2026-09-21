package com.stockhub.supplier.presentation.response;

import com.stockhub.supplier.application.dto.SupplierView;
import java.util.UUID;

public record SupplierResponse(UUID id, String code, String name, String contactName, String email, String phone,
                               String addressLine, String city, String country, String taxId, Integer leadTimeDays,
                               String notes, boolean active, long version) {

    public static SupplierResponse from(SupplierView v) {
        return new SupplierResponse(v.id(), v.code(), v.name(), v.contactName(), v.email(), v.phone(),
                v.addressLine(), v.city(), v.country(), v.taxId(), v.leadTimeDays(), v.notes(), v.active(), v.version());
    }
}
