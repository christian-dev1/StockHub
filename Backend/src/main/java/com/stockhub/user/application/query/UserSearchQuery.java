package com.stockhub.user.application.query;

import com.stockhub.shared.domain.page.PageQuery;
import com.stockhub.shared.security.RoleCode;
import com.stockhub.user.domain.model.UserStatus;

public record UserSearchQuery(String text, RoleCode role, UserStatus status, PageQuery page) {
}
