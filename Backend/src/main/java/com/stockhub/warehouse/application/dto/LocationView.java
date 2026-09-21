package com.stockhub.warehouse.application.dto;

import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.model.LocationType;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public record LocationView(UUID id, String code, String name, LocationType type, String addressLine, String city,
                           String phone, boolean primary, boolean active, long version) {

    public static LocationView from(Location l) {
        return new LocationView(l.id(), l.code(), l.name(), l.type(), l.address().addressLine(), l.address().city(),
                l.address().phone(), l.isPrimary(), l.isActive(), l.version());
    }

    public Map<String, Object> auditSnapshot() {
        var snapshot = new LinkedHashMap<String, Object>();
        snapshot.put("code", code);
        snapshot.put("name", name);
        snapshot.put("type", type);
        snapshot.put("addressLine", addressLine);
        snapshot.put("city", city);
        snapshot.put("phone", phone);
        snapshot.put("primary", primary);
        snapshot.put("active", active);
        return snapshot;
    }
}
