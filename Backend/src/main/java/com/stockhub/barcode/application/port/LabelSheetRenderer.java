package com.stockhub.barcode.application.port;

import com.stockhub.barcode.domain.model.Label;
import com.stockhub.barcode.domain.model.LabelLayout;
import java.util.List;

public interface LabelSheetRenderer {

    /** Renders labels in reading order, starting at the given (0-based) position of the first sheet. */
    byte[] pdf(List<Label> labels, LabelLayout layout, int startPosition);
}
