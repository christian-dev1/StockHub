package com.stockhub.supplier.application.dto;

import com.stockhub.supplier.domain.model.Supplier;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public record SupplierView(UUID id, String code, String name, String contactName, String email, String phone,
                           String addressLine, String city, String country, String taxId, Integer leadTimeDays,
                           String notes, boolean active, long version) {

    public static SupplierView from(Supplier s) {
        var c = s.contact();
        return new SupplierView(s.id(), s.code(), s.name(), c.contactName(), c.email(), c.phone(), c.addressLine(),
                c.city(), c.country(), s.taxId(), s.leadTimeDays(), s.notes(), s.isActive(), s.version());
    }

    public Map<String, Object> auditSnapshot() {
        var snapshot = new LinkedHashMap<String, Object>();
        snapshot.put("code", code);
        snapshot.put("name", name);
        snapshot.put("contactName", contactName);
        snapshot.put("email", email);
        snapshot.put("phone", phone);
        snapshot.put("addressLine", addressLine);
        snapshot.put("city", city);
        snapshot.put("country", country);
        snapshot.put("taxId", taxId);
        snapshot.put("leadTimeDays", leadTimeDays);
        snapshot.put("active", active);
        return snapshot;
    }
}
