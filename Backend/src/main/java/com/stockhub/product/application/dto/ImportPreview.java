package com.stockhub.product.application.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ImportPreview(
        UUID jobId,
        String fileName,
        int totalRows,
        int createCount,
        int updateCount,
        int errorCount,
        List<String> categoriesToCreate,
        List<ImportRowResult> rows,
        Instant expiresAt) {
}
