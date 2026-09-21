package com.stockhub.barcode.infrastructure.rendering;

import com.google.zxing.common.BitMatrix;
import com.stockhub.barcode.application.port.BarcodeRenderer;
import com.stockhub.barcode.domain.model.Symbology;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Component;

@Component
class ZxingBarcodeRenderer implements BarcodeRenderer {

    private static final int QUIET_ZONE_MODULES = 10;
    private static final int BLACK = 0xFF000000;
    private static final int WHITE = 0xFFFFFFFF;

    @Override
    public byte[] png(String value, Symbology symbology, int widthPx, int heightPx) {
        BitMatrix matrix = BarcodeMatrices.encode(value, symbology, widthPx, heightPx, QUIET_ZONE_MODULES);
        BufferedImage image = new BufferedImage(matrix.getWidth(), matrix.getHeight(), BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < matrix.getHeight(); y++) {
            for (int x = 0; x < matrix.getWidth(); x++) {
                image.setRGB(x, y, matrix.get(x, y) ? BLACK : WHITE);
            }
        }
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Vector output: one rectangle per run of bars, scaled freely by the browser or printer. */
    @Override
    public String svg(String value, Symbology symbology, int heightPx) {
        boolean[] modules = BarcodeMatrices.modules(value, symbology);
        int width = modules.length + 2 * QUIET_ZONE_MODULES;
        StringBuilder svg = new StringBuilder()
                .append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ").append(width).append(' ')
                .append(heightPx).append("\" preserveAspectRatio=\"none\" shape-rendering=\"crispEdges\">")
                .append("<rect width=\"100%\" height=\"100%\" fill=\"#fff\"/><g fill=\"#000\">");
        int x = 0;
        while (x < modules.length) {
            if (!modules[x]) {
                x++;
                continue;
            }
            int start = x;
            while (x < modules.length && modules[x]) {
                x++;
            }
            svg.append("<rect x=\"").append(start + QUIET_ZONE_MODULES).append("\" width=\"").append(x - start)
                    .append("\" height=\"").append(heightPx).append("\"/>");
        }
        return svg.append("</g></svg>").toString();
    }
}
