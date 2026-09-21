package com.stockhub.user.domain.model;

import com.stockhub.shared.domain.Ids;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.exception.UserErrors;
import com.stockhub.user.domain.valueobject.Email;
import com.stockhub.user.domain.valueobject.LocationAssignment;
import com.stockhub.user.domain.valueobject.PersonName;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * User aggregate. Invariants: a SUPER_ADMIN has no company and every other user
 * has one; an ADMIN always has access to all locations; any credential or
 * status change increments {@code tokenVersion}, invalidating issued tokens.
 */
public final class User {

    private final UUID id;
    private final UUID companyId;
    private final Email email;
    private String passwordHash;
    private PersonName name;
    private String phone;
    private RoleCode role;
    private LocationAssignment locations;
    private UserStatus status;
    private boolean mustChangePassword;
    private int tokenVersion;
    private Instant lastLoginAt;
    private final long version;

    private User(Builder b) {
        this.id = Objects.requireNonNull(b.id);
        this.companyId = b.companyId;
        this.email = Objects.requireNonNull(b.email);
        this.passwordHash = Objects.requireNonNull(b.passwordHash);
        this.name = Objects.requireNonNull(b.name);
        this.phone = normalizePhone(b.phone);
        this.role = Objects.requireNonNull(b.role);
        this.locations = b.role == RoleCode.ADMIN || b.role == RoleCode.SUPER_ADMIN ? LocationAssignment.ALL : b.locations;
        this.status = Objects.requireNonNull(b.status);
        this.mustChangePassword = b.mustChangePassword;
        this.tokenVersion = b.tokenVersion;
        this.lastLoginAt = b.lastLoginAt;
        this.version = b.version;
        if ((role == RoleCode.SUPER_ADMIN) != (companyId == null)) {
            throw new IllegalStateException("Company scope inconsistent with role " + role);
        }
    }

    /** A company user created by an administrator with a temporary password. */
    public static User newCompanyUser(UUID companyId, Email email, PersonName name, String phone, RoleCode role,
                                      LocationAssignment locations, String temporaryPasswordHash) {
        if (role == RoleCode.SUPER_ADMIN) {
            throw UserErrors.roleNotAssignable(role);
        }
        return new Builder().id(Ids.newId()).companyId(Objects.requireNonNull(companyId)).email(email)
                .passwordHash(temporaryPasswordHash).name(name).phone(phone).role(role).locations(locations)
                .status(UserStatus.ACTIVE).mustChangePassword(true).build();
    }

    public static User newSuperAdmin(Email email, PersonName name, String passwordHash) {
        return new Builder().id(Ids.newId()).email(email).passwordHash(passwordHash).name(name)
                .role(RoleCode.SUPER_ADMIN).locations(LocationAssignment.ALL).status(UserStatus.ACTIVE).build();
    }

    public void updateProfile(PersonName newName, String newPhone) {
        this.name = Objects.requireNonNull(newName);
        this.phone = normalizePhone(newPhone);
    }

    public void changeRole(RoleCode newRole) {
        if (newRole == RoleCode.SUPER_ADMIN || role == RoleCode.SUPER_ADMIN) {
            throw UserErrors.roleNotAssignable(newRole);
        }
        this.role = newRole;
        if (newRole == RoleCode.ADMIN) {
            this.locations = LocationAssignment.ALL;
        }
    }

    public void assignLocations(LocationAssignment assignment) {
        this.locations = role == RoleCode.ADMIN ? LocationAssignment.ALL : Objects.requireNonNull(assignment);
    }

    public void disable() {
        if (status == UserStatus.DISABLED) {
            return;
        }
        status = UserStatus.DISABLED;
        tokenVersion++;
    }

    public void activate() {
        status = UserStatus.ACTIVE;
    }

    /** Password chosen by the user: clears the "must change" flag and logs out other sessions. */
    public void changePassword(String newHash) {
        passwordHash = Objects.requireNonNull(newHash);
        mustChangePassword = false;
        tokenVersion++;
    }

    /** Temporary password set by an administrator. */
    public void resetPassword(String temporaryHash) {
        passwordHash = Objects.requireNonNull(temporaryHash);
        mustChangePassword = true;
        tokenVersion++;
    }

    public void recordLogin(Instant at) {
        lastLoginAt = at;
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public boolean isActiveAdmin() {
        return isActive() && role == RoleCode.ADMIN;
    }

    private static String normalizePhone(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.length() > 40 ? trimmed.substring(0, 40) : trimmed;
    }

    public UUID id() { return id; }
    public UUID companyId() { return companyId; }
    public Email email() { return email; }
    public String passwordHash() { return passwordHash; }
    public PersonName name() { return name; }
    public String phone() { return phone; }
    public RoleCode role() { return role; }
    public LocationAssignment locations() { return locations; }
    public boolean allLocations() { return locations.allLocations(); }
    public Set<UUID> locationIds() { return locations.locationIds(); }
    public UserStatus status() { return status; }
    public boolean mustChangePassword() { return mustChangePassword; }
    public int tokenVersion() { return tokenVersion; }
    public Instant lastLoginAt() { return lastLoginAt; }
    public long version() { return version; }

    /** Rehydration from persistence. */
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private UUID id;
        private UUID companyId;
        private Email email;
        private String passwordHash;
        private PersonName name;
        private String phone;
        private RoleCode role;
        private LocationAssignment locations = LocationAssignment.ALL;
        private UserStatus status = UserStatus.ACTIVE;
        private boolean mustChangePassword;
        private int tokenVersion;
        private Instant lastLoginAt;
        private long version;

        public Builder id(UUID v) { id = v; return this; }
        public Builder companyId(UUID v) { companyId = v; return this; }
        public Builder email(Email v) { email = v; return this; }
        public Builder passwordHash(String v) { passwordHash = v; return this; }
        public Builder name(PersonName v) { name = v; return this; }
        public Builder phone(String v) { phone = v; return this; }
        public Builder role(RoleCode v) { role = v; return this; }
        public Builder locations(LocationAssignment v) { locations = v; return this; }
        public Builder status(UserStatus v) { status = v; return this; }
        public Builder mustChangePassword(boolean v) { mustChangePassword = v; return this; }
        public Builder tokenVersion(int v) { tokenVersion = v; return this; }
        public Builder lastLoginAt(Instant v) { lastLoginAt = v; return this; }
        public Builder version(long v) { version = v; return this; }

        public User build() {
            return new User(this);
        }
    }
}
