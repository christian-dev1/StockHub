package com.stockhub.product.application.port;

import java.util.List;
import java.util.Map;

/** Reads a CSV or XLSX file into rows keyed by the (raw) header of each column. */
public interface TabularFileReader {

    int MAX_ROWS = 5000;

    /** @throws com.stockhub.shared.domain.exception.InvalidInputException for unsupported or unreadable files */
    List<Map<String, String>> read(String fileName, byte[] content);
}
