package com.stockhub.user.presentation.controller;

import com.stockhub.shared.security.RoleCode;
import com.stockhub.shared.web.PageRequestParams;
import com.stockhub.shared.web.PageResponse;
import com.stockhub.user.application.command.AssignLocationsCommand;
import com.stockhub.user.application.command.CreateUserCommand;
import com.stockhub.user.application.command.UpdateUserProfileCommand;
import com.stockhub.user.application.query.UserSearchQuery;
import com.stockhub.user.application.usecase.AssignUserLocationsUseCase;
import com.stockhub.user.application.usecase.ChangeUserRoleUseCase;
import com.stockhub.user.application.usecase.ChangeUserStatusUseCase;
import com.stockhub.user.application.usecase.CreateUserUseCase;
import com.stockhub.user.application.usecase.ResetUserPasswordUseCase;
import com.stockhub.user.application.usecase.UpdateUserProfileUseCase;
import com.stockhub.user.application.usecase.UserQueries;
import com.stockhub.user.domain.model.UserStatus;
import com.stockhub.user.presentation.request.AssignLocationsRequest;
import com.stockhub.user.presentation.request.ChangeRoleRequest;
import com.stockhub.user.presentation.request.CreateUserRequest;
import com.stockhub.user.presentation.request.ResetPasswordRequest;
import com.stockhub.user.presentation.request.UpdateUserRequest;
import com.stockhub.user.presentation.response.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Users of the current company")
class UserController {

    private static final Set<String> SORTABLE = Set.of("email", "lastName", "role", "status", "lastLoginAt", "createdAt");

    private final UserQueries queries;
    private final CreateUserUseCase createUser;
    private final UpdateUserProfileUseCase updateProfile;
    private final ChangeUserRoleUseCase changeRole;
    private final AssignUserLocationsUseCase assignLocations;
    private final ChangeUserStatusUseCase changeStatus;
    private final ResetUserPasswordUseCase resetPassword;

    UserController(UserQueries queries, CreateUserUseCase createUser, UpdateUserProfileUseCase updateProfile,
                   ChangeUserRoleUseCase changeRole, AssignUserLocationsUseCase assignLocations,
                   ChangeUserStatusUseCase changeStatus, ResetUserPasswordUseCase resetPassword) {
        this.queries = queries;
        this.createUser = createUser;
        this.updateProfile = updateProfile;
        this.changeRole = changeRole;
        this.assignLocations = assignLocations;
        this.changeStatus = changeStatus;
        this.resetPassword = resetPassword;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_VIEW')")
    @Operation(summary = "Search users (paginated, sortable)")
    PageResponse<UserResponse> search(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) RoleCode role,
                                      @RequestParam(required = false) UserStatus status,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @RequestParam(required = false) String sort) {
        var pageQuery = PageRequestParams.toQuery(page, size, sort, SORTABLE, "lastName");
        return PageResponse.of(queries.search(new UserSearchQuery(q, role, status, pageQuery)), UserResponse::from);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_VIEW')")
    UserResponse get(@PathVariable UUID id) {
        return UserResponse.from(queries.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    @Operation(summary = "Create a user with a temporary password")
    ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        var view = createUser.execute(new CreateUserCommand(request.email(), request.firstName(), request.lastName(),
                request.phone(), request.role(), Boolean.TRUE.equals(request.allLocations()), request.locationIds(), request.temporaryPassword()));
        return ResponseEntity.created(URI.create("/api/v1/users/" + view.id())).body(UserResponse.from(view));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    UserResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        return UserResponse.from(updateProfile.execute(new UpdateUserProfileCommand(id, request.firstName(),
                request.lastName(), request.phone(), request.version())));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    UserResponse changeRole(@PathVariable UUID id, @Valid @RequestBody ChangeRoleRequest request) {
        return UserResponse.from(changeRole.execute(id, request.role()));
    }

    @PutMapping("/{id}/locations")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    UserResponse assignLocations(@PathVariable UUID id, @Valid @RequestBody AssignLocationsRequest request) {
        return UserResponse.from(assignLocations.execute(
                new AssignLocationsCommand(id, Boolean.TRUE.equals(request.allLocations()), request.locationIds())));
    }

    @PostMapping("/{id}/disable")
    @PreAuthorize("hasAuthority('USER_DISABLE')")
    UserResponse disable(@PathVariable UUID id) {
        return UserResponse.from(changeStatus.disable(id));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('USER_DISABLE')")
    UserResponse activate(@PathVariable UUID id) {
        return UserResponse.from(changeStatus.activate(id));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    ResponseEntity<Void> resetPassword(@PathVariable UUID id, @Valid @RequestBody ResetPasswordRequest request) {
        resetPassword.execute(id, request.temporaryPassword());
        return ResponseEntity.noContent().build();
    }
}
