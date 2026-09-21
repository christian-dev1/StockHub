package com.stockhub.barcode.application.command;

import java.util.UUID;

public record LabelRequestItem(UUID productId, int copies) {
}
