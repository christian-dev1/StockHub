package com.stockhub.warehouse;

import java.util.UUID;

public record LocationSummary(UUID id, String code, String name, String type, boolean primary, boolean active) {
}
