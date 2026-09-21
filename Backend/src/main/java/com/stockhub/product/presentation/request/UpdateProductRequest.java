package com.stockhub.product.presentation.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateProductRequest(@NotNull @Valid ProductRequest product, @NotNull Long version) {
}
