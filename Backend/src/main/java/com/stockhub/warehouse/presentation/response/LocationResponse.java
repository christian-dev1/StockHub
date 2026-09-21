package com.stockhub.warehouse.presentation.response;

import com.stockhub.warehouse.application.dto.LocationView;
import com.stockhub.warehouse.domain.model.LocationType;
import java.util.UUID;

public record LocationResponse(UUID id, String code, String name, LocationType type, String addressLine, String city,
                               String phone, boolean primary, boolean active, long version) {

    public static LocationResponse from(LocationView v) {
        return new LocationResponse(v.id(), v.code(), v.name(), v.type(), v.addressLine(), v.city(), v.phone(),
                v.primary(), v.active(), v.version());
    }
}
