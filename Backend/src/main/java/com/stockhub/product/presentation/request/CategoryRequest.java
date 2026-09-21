package com.stockhub.product.presentation.request;

import com.stockhub.product.application.command.CategoryCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CategoryRequest(@NotBlank @Size(max = 100) String name, @Size(max = 500) String description,
                              UUID parentId) {

    public CategoryCommand toCommand() {
        return new CategoryCommand(name, description, parentId);
    }
}
