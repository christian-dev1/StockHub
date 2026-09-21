package com.stockhub.product.application.dto;

import java.util.List;

/** @param action CREATE, UPDATE or ERROR */
public record ImportRowResult(int rowNumber, String action, String sku, String name, List<ImportIssue> issues) {
}
