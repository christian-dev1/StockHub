package com.stockhub.barcode.presentation.request;

import com.stockhub.barcode.domain.model.Symbology;

/** @param format CODE128 (default) or EAN13 */
public record GenerateBarcodeRequest(Symbology format, Boolean replaceExisting) {
}
