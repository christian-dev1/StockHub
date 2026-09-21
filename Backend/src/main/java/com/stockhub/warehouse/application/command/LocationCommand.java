package com.stockhub.warehouse.application.command;

import com.stockhub.warehouse.domain.model.LocationType;

public record LocationCommand(String code, String name, LocationType type, String addressLine, String city,
                              String phone) {
}
