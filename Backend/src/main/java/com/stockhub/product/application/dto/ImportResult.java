package com.stockhub.product.application.dto;

import java.util.UUID;

public record ImportResult(UUID jobId, int created, int updated, int categoriesCreated) {
}
