package com.stockhub.user.application.usecase;

import com.stockhub.shared.application.CacheNames;
import com.stockhub.user.UserAuthorities;
import com.stockhub.user.UserDirectory;
import com.stockhub.user.application.port.PasswordHasher;
import com.stockhub.user.domain.model.User;
import com.stockhub.user.domain.repository.RolePermissionRepository;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.valueobject.Email;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class UserDirectoryService implements UserDirectory {

    private final UserRepository users;
    private final RolePermissionRepository rolePermissions;
    private final PasswordHasher hasher;
    private final Clock clock;
    private final String dummyHash;

    UserDirectoryService(UserRepository users, RolePermissionRepository rolePermissions, PasswordHasher hasher,
                         Clock clock) {
        this.users = users;
        this.rolePermissions = rolePermissions;
        this.hasher = hasher;
        this.clock = clock;
        this.dummyHash = hasher.hash("timing-equalizer-" + UUID.randomUUID());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UUID> verifyCredentials(String email, String rawPassword) {
        Optional<User> user;
        try {
            user = users.findByEmail(new Email(email));
        } catch (RuntimeException invalidEmail) {
            user = Optional.empty();
        }
        String password = rawPassword == null ? "" : rawPassword;
        // Always run the hash comparison so response time does not reveal whether the account exists.
        boolean matches = hasher.matches(password, user.map(User::passwordHash).orElse(dummyHash));
        return user.filter(u -> matches).map(User::id);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.USER_AUTHORITIES, unless = "#result == null")
    public Optional<UserAuthorities> loadAuthorities(UUID userId) {
        return users.findById(userId).map(user -> new UserAuthorities(
                user.id(), user.companyId(), user.email().value(), user.name().firstName(), user.name().lastName(),
                user.role(), rolePermissions.permissionsOf(user.role()), user.allLocations(), user.locationIds(),
                user.isActive(), user.mustChangePassword(), user.tokenVersion()));
    }

    @Override
    @Transactional
    public void recordSuccessfulLogin(UUID userId) {
        users.updateLastLogin(userId, Instant.now(clock));
    }
}
