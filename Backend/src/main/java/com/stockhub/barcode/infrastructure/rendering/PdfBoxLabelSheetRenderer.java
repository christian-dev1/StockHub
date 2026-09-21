package com.stockhub.barcode.infrastructure.rendering;

import com.stockhub.barcode.application.port.LabelSheetRenderer;
import com.stockhub.barcode.domain.model.Label;
import com.stockhub.barcode.domain.model.LabelLayout;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

/**
 * Draws labels on A4 sheets. Bars are vector rectangles, so they stay sharp
 * at any printer resolution. Label cells are centred on the page.
 */
@Component
class PdfBoxLabelSheetRenderer implements LabelSheetRenderer {

    private static final float POINTS_PER_MM = 72f / 25.4f;
    private static final float PADDING = 2.5f * POINTS_PER_MM;
    private static final PDType1Font REGULAR = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDType1Font BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    @Override
    public byte[] pdf(List<Label> labels, LabelLayout layout, int startPosition) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            float cellWidth = (float) layout.widthMm() * POINTS_PER_MM;
            float cellHeight = (float) layout.heightMm() * POINTS_PER_MM;
            PDRectangle a4 = PDRectangle.A4;
            float marginX = (a4.getWidth() - cellWidth * layout.columns()) / 2;
            float marginTop = (a4.getHeight() - cellHeight * layout.rows()) / 2;
            int slot = startPosition;
            PDPageContentStream content = null;
            try {
                for (Label label : labels) {
                    if (content == null || slot == layout.perPage()) {
                        if (content != null) {
                            content.close();
                            slot = 0;
                        }
                        PDPage page = new PDPage(a4);
                        document.addPage(page);
                        content = new PDPageContentStream(document, page);
                    }
                    float x = marginX + (slot % layout.columns()) * cellWidth;
                    float top = a4.getHeight() - marginTop - (slot / layout.columns()) * cellHeight;
                    drawLabel(content, label, x, top - cellHeight, cellWidth, cellHeight);
                    slot++;
                }
            } finally {
                if (content != null) {
                    content.close();
                }
            }
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void drawLabel(PDPageContentStream content, Label label, float x, float y, float width, float height)
            throws IOException {
        float innerWidth = width - 2 * PADDING;
        float nameSize = Math.min(9f, height / 6);
        float textSize = Math.min(7f, height / 8);
        float cursor = y + height - PADDING - nameSize;
        writeText(content, BOLD, nameSize, fit(label.productName(), BOLD, nameSize, innerWidth), x + PADDING, cursor);
        if (label.price() != null) {
            String price = printable(label.price());
            float priceWidth = BOLD.getStringWidth(price) / 1000 * nameSize;
            cursor -= nameSize + 1;
            writeText(content, BOLD, nameSize, price, x + width - PADDING - priceWidth, cursor);
        }
        float barsBottom = y + PADDING + textSize + 2;
        float barsTop = cursor - 3;
        drawBars(content, BarcodeMatrices.modules(label.barcode(), label.symbology()), x + PADDING, barsBottom,
                innerWidth, Math.max(barsTop - barsBottom, 8));
        String caption = printable(label.barcode() + "   " + label.sku());
        float captionWidth = REGULAR.getStringWidth(caption) / 1000 * textSize;
        writeText(content, REGULAR, textSize, caption, x + (width - captionWidth) / 2, y + PADDING);
    }

    private static void drawBars(PDPageContentStream content, boolean[] modules, float x, float y, float width,
                                 float height) throws IOException {
        float module = width / modules.length;
        int i = 0;
        while (i < modules.length) {
            if (!modules[i]) {
                i++;
                continue;
            }
            int start = i;
            while (i < modules.length && modules[i]) {
                i++;
            }
            content.addRect(x + start * module, y, (i - start) * module, height);
        }
        content.fill();
    }

    private static void writeText(PDPageContentStream content, PDType1Font font, float size, String text, float x,
                                  float y) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
    }

    /** Truncates with an ellipsis so that the text fits the label width. */
    private static String fit(String text, PDType1Font font, float size, float maxWidth) throws IOException {
        String value = printable(text);
        if (font.getStringWidth(value) / 1000 * size <= maxWidth) {
            return value;
        }
        while (!value.isEmpty() && font.getStringWidth(value + "...") / 1000 * size > maxWidth) {
            value = value.substring(0, value.length() - 1);
        }
        return value + "...";
    }

    /** Standard PDF fonts only cover WinAnsi (Latin-1); other characters are replaced. */
    private static String printable(String text) {
        StringBuilder result = new StringBuilder(text.length());
        text.codePoints().forEach(cp -> {
            try {
                REGULAR.encode(new String(Character.toChars(cp)));
                result.appendCodePoint(cp);
            } catch (IOException | IllegalArgumentException e) {
                result.append('?');
            }
        });
        return result.toString();
    }
}
