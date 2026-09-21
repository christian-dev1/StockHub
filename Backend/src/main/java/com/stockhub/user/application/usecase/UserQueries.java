package com.stockhub.user.application.usecase;

import com.stockhub.shared.domain.page.PageResult;
import com.stockhub.shared.security.CurrentUser;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.application.dto.RoleView;
import com.stockhub.user.application.dto.UserView;
import com.stockhub.user.application.query.UserSearchQuery;
import com.stockhub.user.domain.repository.RolePermissionRepository;
import com.stockhub.user.domain.repository.UserRepository;
import com.stockhub.user.domain.repository.UserRepository.UserSearchCriteria;
import com.stockhub.user.domain.service.RoleAssignmentPolicy;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserQueries {

    private final UserRepository users;
    private final RolePermissionRepository rolePermissions;
    private final CompanyUserAccess access;

    UserQueries(UserRepository users, RolePermissionRepository rolePermissions, CompanyUserAccess access) {
        this.users = users;
        this.rolePermissions = rolePermissions;
        this.access = access;
    }

    public PageResult<UserView> search(UserSearchQuery query) {
        UUID companyId = access.actor().requireCompanyId();
        return users.search(companyId, new UserSearchCriteria(query.text(), query.role(), query.status()), query.page())
                .map(UserView::from);
    }

    public UserView get(UUID userId) {
        return UserView.from(access.load(userId));
    }

    public List<RoleView> roles() {
        CurrentUser actor = access.actor();
        var matrix = rolePermissions.matrix();
        return Arrays.stream(RoleCode.values())
                .map(role -> new RoleView(role, role.isPlatform(), matrix.getOrDefault(role, java.util.Set.of()),
                        isAssignable(actor.role(), role)))
                .toList();
    }

    private static boolean isAssignable(RoleCode actor, RoleCode target) {
        try {
            RoleAssignmentPolicy.requireAssignable(actor, target);
            return true;
        } catch (RuntimeException notAssignable) {
            return false;
        }
    }
}
