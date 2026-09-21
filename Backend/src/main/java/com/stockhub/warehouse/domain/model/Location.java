package com.stockhub.warehouse.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.domain.exception.BusinessRuleViolationException;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * A physical place where stock is held. Exactly one location per company is
 * primary; the primary location is always active.
 */
public final class Location {

    private final UUID id;
    private final UUID companyId;
    private String code;
    private String name;
    private LocationType type;
    private LocationAddress address;
    private boolean primary;
    private boolean active;
    private final long version;

    public Location(UUID id, UUID companyId, String code, String name, LocationType type, LocationAddress address,
                    boolean primary, boolean active, long version) {
        this.id = Objects.requireNonNull(id);
        this.companyId = Objects.requireNonNull(companyId);
        this.code = validCode(code);
        this.name = requireText(name, "name", 150);
        this.type = Objects.requireNonNull(type);
        this.address = address == null ? LocationAddress.EMPTY : address;
        this.primary = primary;
        this.active = active;
        this.version = version;
    }

    /** The primary location is a store named after the company, e.g. "Alpha Market - Principal". */
    public static Location primaryFor(UUID companyId, String companyName, String primarySuffix) {
        String name = truncate(companyName + " - " + primarySuffix, 150);
        return new Location(Ids.newId(), companyId, "MAIN", name, LocationType.STORE, LocationAddress.EMPTY,
                true, true, 0);
    }

    public static Location create(UUID companyId, String code, String name, LocationType type, LocationAddress address) {
        return new Location(Ids.newId(), companyId, code, name, type, address, false, true, 0);
    }

    public void update(String newCode, String newName, LocationType newType, LocationAddress newAddress) {
        this.code = validCode(newCode);
        this.name = requireText(newName, "name", 150);
        this.type = Objects.requireNonNull(newType);
        this.address = newAddress == null ? LocationAddress.EMPTY : newAddress;
    }

    public void activate() {
        active = true;
    }

    public void deactivate() {
        if (primary) {
            throw new BusinessRuleViolationException("LOCATION_PRIMARY_CANNOT_BE_DISABLED",
                    "The primary location cannot be disabled; make another location primary first.");
        }
        active = false;
    }

    public void makePrimary() {
        if (!active) {
            throw new BusinessRuleViolationException("LOCATION_INACTIVE",
                    "An inactive location cannot become the primary location.");
        }
        primary = true;
    }

    public void demote() {
        primary = false;
    }

    private static String validCode(String value) {
        String code = requireText(value, "code", 30).toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z0-9][A-Z0-9_-]*")) {
            throw new InvalidInputException("code", "LOCATION_CODE_INVALID",
                    "Code may only contain letters, digits, '-' and '_'.");
        }
        return code;
    }

    private static String requireText(String value, String field, int max) {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(field, "LOCATION_" + field.toUpperCase(Locale.ROOT) + "_REQUIRED",
                    field + " is required.");
        }
        String trimmed = value.strip();
        if (trimmed.length() > max) {
            throw new InvalidInputException(field, "LOCATION_" + field.toUpperCase(Locale.ROOT) + "_TOO_LONG",
                    field + " is too long.");
        }
        return trimmed;
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public String code() { return code; }
    public String name() { return name; }
    public LocationType type() { return type; }
    public LocationAddress address() { return address; }
    public boolean isPrimary() { return primary; }
    public boolean isActive() { return active; }
    public long version() { return version; }
}
