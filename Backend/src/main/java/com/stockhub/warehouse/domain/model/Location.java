package com.stockhub.warehouse.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Objects;
import java.util.UUID;

/** A physical place where stock is held. */
public final class Location {

    private final UUID id;
    private final UUID companyId;
    private final String code;
    private final String name;
    private final LocationType type;
    private final boolean primary;
    private final boolean active;
    private final long version;

    public Location(UUID id, UUID companyId, String code, String name, LocationType type,
                    boolean primary, boolean active, long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.code = requireText(code, "code", 30);
        this.name = requireText(name, "name", 150);
        this.type = Objects.requireNonNull(type);
        this.primary = primary;
        this.active = active;
        this.version = version;
    }

    /** The primary location is a store named after the company, e.g. "Alpha Market - Principal". */
    public static Location primaryFor(UUID companyId, String companyName, String primarySuffix) {
        String name = truncate(companyName + " - " + primarySuffix, 150);
        return new Location(Ids.newId(), companyId, "MAIN", name, LocationType.STORE, true, true, 0);
    }

    private static String requireText(String value, String field, int max) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(field, "LOCATION_" + field.toUpperCase() + "_REQUIRED", field + " is required.");
        }
        if (value.length() > max) {
            throw new InvalidInputException(field, "LOCATION_" + field.toUpperCase() + "_TOO_LONG", field + " is too long.");
        }
        return value.strip();
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public String code() { return code; }
    public String name() { return name; }
    public LocationType type() { return type; }
    public boolean isPrimary() { return primary; }
    public boolean isActive() { return active; }
    public long version() { return version; }
}
