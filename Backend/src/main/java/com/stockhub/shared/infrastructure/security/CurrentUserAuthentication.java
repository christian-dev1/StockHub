package com.stockhub.shared.infrastructure.security;

import com.stockhub.shared.security.CurrentUser;
import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

/** Spring Security authentication whose principal is the resolved {@link CurrentUser}. */
public class CurrentUserAuthentication extends AbstractAuthenticationToken {

    private final CurrentUser user;
    private final String token;

    public CurrentUserAuthentication(CurrentUser user, String token, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.user = user;
        this.token = token;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public CurrentUser getPrincipal() {
        return user;
    }

    @Override
    public String getName() {
        return user.userId().toString();
    }
}
