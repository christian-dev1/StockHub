package com.stockhub.barcode.application.command;

import com.stockhub.barcode.domain.model.LabelLayout;
import java.util.List;

/** @param startPosition first free slot on a partially used sheet (0-based) */
public record PrintLabelsCommand(List<LabelRequestItem> items, LabelLayout layout, boolean showPrice, int startPosition) {
}
