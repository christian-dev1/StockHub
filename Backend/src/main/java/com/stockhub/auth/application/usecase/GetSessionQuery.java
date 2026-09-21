package com.stockhub.auth.application.usecase;

import com.stockhub.auth.application.dto.SessionView;
import com.stockhub.company.CompanyApi;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.shared.domain.exception.UnauthorizedException;
import com.stockhub.shared.security.CurrentUserProvider;
import com.stockhub.user.UserAuthorities;
import com.stockhub.user.UserDirectory;
import com.stockhub.warehouse.LocationApi;
import com.stockhub.warehouse.LocationSummary;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetSessionQuery {

    private final CurrentUserProvider currentUser;
    private final UserDirectory users;
    private final CompanyApi companies;
    private final LocationApi locations;

    GetSessionQuery(CurrentUserProvider currentUser, UserDirectory users, CompanyApi companies, LocationApi locations) {
        this.currentUser = currentUser;
        this.users = users;
        this.companies = companies;
        this.locations = locations;
    }

    @Transactional(readOnly = true)
    public SessionView execute() {
        return describe(currentUser.require().userId());
    }

    @Transactional(readOnly = true)
    public SessionView describe(UUID userId) {
        UserAuthorities user = users.loadAuthorities(userId)
                .orElseThrow(() -> new UnauthorizedException("UNAUTHORIZED", "Unknown user."));
        CompanySnapshot company = user.companyId() == null ? null : companies.find(user.companyId()).orElse(null);
        List<LocationSummary> accessible = user.companyId() == null ? List.of()
                : user.allLocations() ? locations.findAllActive(user.companyId())
                : locations.findByIds(user.companyId(), user.locationIds()).stream().filter(LocationSummary::active).toList();
        return new SessionView(user.userId(), user.email(), user.firstName(), user.lastName(), user.role(),
                user.mustChangePassword() ? java.util.Set.of() : user.permissions(), user.mustChangePassword(),
                user.allLocations(), accessible, company);
    }
}
