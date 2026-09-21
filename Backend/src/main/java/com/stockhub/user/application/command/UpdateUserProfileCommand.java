package com.stockhub.user.application.command;

import java.util.UUID;

public record UpdateUserProfileCommand(UUID userId, String firstName, String lastName, String phone, long version) {
}
