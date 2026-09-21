package com.stockhub.product.domain.model;

import com.stockhub.shared.domain.exception.InvalidInputException;
import java.util.Objects;
import java.util.UUID;

/** Product picture; the format is detected from the file content, never trusted from the client. */
public record ProductImage(UUID productId, UUID companyId, String contentType, byte[] data) {

    public static final int MAX_BYTES = 2 * 1024 * 1024;

    public ProductImage {
        Objects.requireNonNull(productId);
        Objects.requireNonNull(companyId);
        Objects.requireNonNull(data);
        if (data.length == 0 || data.length > MAX_BYTES) {
            throw new InvalidInputException("file", "PRODUCT_IMAGE_TOO_LARGE", "Image must not exceed 2 MB.");
        }
        contentType = detectContentType(data);
    }

    public static ProductImage of(UUID productId, UUID companyId, byte[] data) {
        return new ProductImage(productId, companyId, null, data);
    }

    private static String detectContentType(byte[] d) {
        if (d.length > 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') {
            return "image/png";
        }
        if (d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        throw new InvalidInputException("file", "PRODUCT_IMAGE_UNSUPPORTED", "Only PNG, JPEG and WebP images are accepted.");
    }
}
