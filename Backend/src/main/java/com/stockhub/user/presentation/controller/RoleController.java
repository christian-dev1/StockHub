package com.stockhub.user.presentation.controller;

import com.stockhub.user.application.usecase.UserQueries;
import com.stockhub.user.presentation.response.RoleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/roles")
@Tag(name = "Users")
class RoleController {

    private final UserQueries queries;

    RoleController(UserQueries queries) {
        this.queries = queries;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_VIEW')")
    @Operation(summary = "Roles with their permissions and whether the caller may assign them")
    List<RoleResponse> list() {
        return queries.roles().stream().map(RoleResponse::from).toList();
    }
}
