package com.stockhub.supplier.presentation.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateSupplierRequest(@NotNull @Valid SupplierRequest supplier, @NotNull Long version) {
}
