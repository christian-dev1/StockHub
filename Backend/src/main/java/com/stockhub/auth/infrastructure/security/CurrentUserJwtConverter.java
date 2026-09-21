package com.stockhub.auth.infrastructure.security;

import com.stockhub.company.CompanyApi;
import com.stockhub.shared.infrastructure.security.CurrentUserAuthentication;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.user.UserAuthorities;
import com.stockhub.user.UserDirectory;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

/**
 * Turns a cryptographically valid JWT into the request's {@link CurrentUser}.
 * Rejects the token when the user or company was disabled, when the user's
 * credentials changed since issuance (token version), or when the company claim
 * does not match the user's company.
 */
@Component
class CurrentUserJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    static final String PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

    private final UserDirectory users;
    private final CompanyApi companies;

    CurrentUserJwtConverter(UserDirectory users, CompanyApi companies) {
        this.users = users;
        this.companies = companies;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID userId = parse(jwt.getSubject());
        UserAuthorities user = users.loadAuthorities(userId).orElseThrow(() -> rejected("unknown user"));
        Number tokenVersion = jwt.getClaim(JwtAccessTokenIssuer.TOKEN_VERSION_CLAIM);
        String companyClaim = jwt.getClaimAsString(JwtAccessTokenIssuer.COMPANY_CLAIM);

        if (!user.active()) {
            throw rejected("account disabled");
        }
        if (tokenVersion == null || tokenVersion.intValue() != user.tokenVersion()) {
            throw rejected("token revoked");
        }
        if (!Objects.equals(companyClaim, user.companyId() == null ? null : user.companyId().toString())) {
            throw rejected("company mismatch");
        }
        if (user.companyId() != null && !companies.isActive(user.companyId())) {
            throw rejected("company disabled");
        }

        CurrentUser current = new CurrentUser(user.userId(), user.companyId(), user.email(), user.role(),
                user.mustChangePassword() ? java.util.Set.of() : user.permissions(),
                user.allLocations(), user.locationIds(), user.mustChangePassword());
        return new CurrentUserAuthentication(current, jwt.getTokenValue(), authorities(current));
    }

    /** Until a temporary password is replaced, the user holds no permission at all. */
    private static List<GrantedAuthority> authorities(CurrentUser user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.mustChangePassword()) {
            authorities.add(new SimpleGrantedAuthority(PASSWORD_CHANGE_REQUIRED));
            return authorities;
        }
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.role().name()));
        user.permissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.name())));
        return authorities;
    }

    private static UUID parse(String subject) {
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw rejected("malformed subject");
        }
    }

    private static InvalidBearerTokenException rejected(String reason) {
        return new InvalidBearerTokenException("Access token rejected: " + reason);
    }
}
