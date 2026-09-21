package com.stockhub.product.application.usecase;

import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

/** Downloadable CSV template listing the expected columns with one example row. */
@Component
public class ProductImportTemplate {

    private static final String EXAMPLE =
            ",Eau minérale 1.5L,Bouteille plastique,Boissons,SUP-0001,UNIT,250,400,24,48,6001234567890,EAN13,false,false";

    public byte[] csv() {
        String header = String.join(",", ImportColumns.TEMPLATE);
        String content = "﻿" + header + "\r\n" + EXAMPLE + "\r\n";
        return content.getBytes(StandardCharsets.UTF_8);
    }
}
