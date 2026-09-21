package com.stockhub.warehouse.presentation.response;

import com.stockhub.warehouse.LocationSummary;
import java.util.UUID;

public record LocationResponse(UUID id, String code, String name, String type, boolean primary, boolean active) {

    public static LocationResponse from(LocationSummary location) {
        return new LocationResponse(location.id(), location.code(), location.name(), location.type(),
                location.primary(), location.active());
    }
}
