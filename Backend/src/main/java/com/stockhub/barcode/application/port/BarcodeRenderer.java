package com.stockhub.barcode.application.port;

import com.stockhub.barcode.domain.model.Symbology;

public interface BarcodeRenderer {

    byte[] png(String value, Symbology symbology, int widthPx, int heightPx);

    String svg(String value, Symbology symbology, int heightPx);
}
