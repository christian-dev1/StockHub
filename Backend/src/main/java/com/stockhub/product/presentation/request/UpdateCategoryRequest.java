package com.stockhub.product.presentation.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateCategoryRequest(@NotNull @Valid CategoryRequest category, @NotNull Long version) {
}
