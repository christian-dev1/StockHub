package com.stockhub.shared.infrastructure.security;

import com.stockhub.shared.domain.exception.UnauthorizedException;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.CurrentUserProvider;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
class SecurityContextCurrentUserProvider implements CurrentUserProvider {

    @Override
    public Optional<CurrentUser> current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CurrentUser user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    @Override
    public CurrentUser require() {
        return current().orElseThrow(() -> new UnauthorizedException("UNAUTHORIZED", "Authentication required."));
    }
}
