package com.stockhub.supplier;

import java.util.UUID;

/** @param leadTimeDays delivery lead time, or {@code null} to use the company default */
public record SupplierSummary(UUID id, String code, String name, boolean active, Integer leadTimeDays) {
}
