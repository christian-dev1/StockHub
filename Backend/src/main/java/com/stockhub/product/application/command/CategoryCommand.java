package com.stockhub.product.application.command;

import java.util.UUID;

public record CategoryCommand(String name, String description, UUID parentId) {
}
