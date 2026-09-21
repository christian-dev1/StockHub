package com.stockhub.warehouse.presentation.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateLocationRequest(@NotNull @Valid LocationRequest location, @NotNull Long version) {
}
