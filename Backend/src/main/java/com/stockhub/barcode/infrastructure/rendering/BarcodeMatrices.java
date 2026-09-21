package com.stockhub.barcode.infrastructure.rendering;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Map;

/** Encodes values with ZXing; a 1-pixel-high matrix gives the module pattern of a linear barcode. */
final class BarcodeMatrices {

    private BarcodeMatrices() {
    }

    /** One boolean per module (true = bar), without quiet zones. */
    static boolean[] modules(String value, Symbology symbology) {
        BitMatrix matrix = encode(value, symbology, 0, 1, 0);
        boolean[] modules = new boolean[matrix.getWidth()];
        for (int x = 0; x < modules.length; x++) {
            modules[x] = matrix.get(x, 0);
        }
        return modules;
    }

    static BitMatrix encode(String value, Symbology symbology, int width, int height, int margin) {
        try {
            return new MultiFormatWriter().encode(value, zxingFormat(symbology), width, height,
                    Map.of(EncodeHintType.MARGIN, margin));
        } catch (WriterException | IllegalArgumentException e) {
            throw new InvalidInputException("barcode", "BARCODE_NOT_ENCODABLE", "This value cannot be encoded.");
        }
    }

    private static BarcodeFormat zxingFormat(Symbology symbology) {
        return switch (symbology) {
            case CODE128 -> BarcodeFormat.CODE_128;
            case EAN13 -> BarcodeFormat.EAN_13;
            case EAN8 -> BarcodeFormat.EAN_8;
            case UPC_A -> BarcodeFormat.UPC_A;
        };
    }
}
