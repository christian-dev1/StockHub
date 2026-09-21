package com.stockhub.user.presentation.controller;

import com.stockhub.user.application.usecase.ChangeOwnPasswordUseCase;
import com.stockhub.user.presentation.request.ChangePasswordRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Authentication")
class PasswordController {

    private final ChangeOwnPasswordUseCase changeOwnPassword;

    PasswordController(ChangeOwnPasswordUseCase changeOwnPassword) {
        this.changeOwnPassword = changeOwnPassword;
    }

    @PostMapping("/api/v1/auth/change-password")
    @Operation(summary = "Change own password; every session is revoked and the client must sign in again")
    ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        changeOwnPassword.execute(request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}
