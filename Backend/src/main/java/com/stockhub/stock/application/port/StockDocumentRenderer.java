package com.stockhub.stock.application.port;

import com.stockhub.stock.application.dto.StockViews;

/** Printable version of a stock note. */
public interface StockDocumentRenderer {

    /**
     * @param companyName shown in the header
     * @param zoneId company time zone, for the printed date
     * @param locale company locale (labels and numbers)
     */
    byte[] pdf(StockViews.Document document, String companyName, String zoneId, String locale);
}
