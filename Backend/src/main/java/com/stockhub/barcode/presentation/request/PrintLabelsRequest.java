package com.stockhub.barcode.presentation.request;

import com.stockhub.barcode.application.command.LabelRequestItem;
import com.stockhub.barcode.application.command.PrintLabelsCommand;
import com.stockhub.barcode.domain.model.LabelLayout;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record PrintLabelsRequest(
        @NotEmpty @Size(max = 200) List<@Valid Item> items,
        LabelLayout layout,
        Boolean showPrice,
        @Min(0) @Max(39) Integer startPosition) {

    public record Item(@NotNull UUID productId, @Min(1) @Max(500) int copies) {
    }

    public PrintLabelsCommand toCommand() {
        return new PrintLabelsCommand(items.stream().map(i -> new LabelRequestItem(i.productId(), i.copies())).toList(),
                layout == null ? LabelLayout.A4_3X8 : layout, !Boolean.FALSE.equals(showPrice),
                startPosition == null ? 0 : startPosition);
    }
}
