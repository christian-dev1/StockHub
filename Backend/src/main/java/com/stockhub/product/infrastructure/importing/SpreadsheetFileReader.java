package com.stockhub.product.infrastructure.importing;

import com.stockhub.product.application.port.TabularFileReader;
import com.stockhub.shared.domain.exception.InvalidInputException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

/**
 * Reads CSV (UTF-8, ',' or ';' separated, as exported by Excel in French
 * locales) and XLSX files (first sheet). Blank lines are skipped.
 */
@Component
class SpreadsheetFileReader implements TabularFileReader {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    @Override
    public List<Map<String, String>> read(String fileName, byte[] content) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        try {
            List<Map<String, String>> rows;
            if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
                rows = readCsv(content);
            } else if (lower.endsWith(".xlsx")) {
                rows = readXlsx(content);
            } else {
                throw new InvalidInputException("file", "IMPORT_FORMAT_UNSUPPORTED", "Only CSV and XLSX files are supported.");
            }
            if (rows.size() > MAX_ROWS) {
                throw new InvalidInputException("file", "IMPORT_TOO_MANY_ROWS", "A file may contain at most %d rows.",
                        MAX_ROWS);
            }
            return rows;
        } catch (IOException | RuntimeException e) {
            if (e instanceof InvalidInputException invalid) {
                throw invalid;
            }
            throw new InvalidInputException("file", "IMPORT_FILE_UNREADABLE", "The file could not be read.");
        }
    }

    private static List<Map<String, String>> readCsv(byte[] content) throws IOException {
        String text = new String(stripBom(content), StandardCharsets.UTF_8);
        char delimiter = detectDelimiter(text);
        CSVFormat format = CSVFormat.DEFAULT.builder().setDelimiter(delimiter).setHeader()
                .setSkipHeaderRecord(true).setIgnoreEmptyLines(true).setTrim(true).get();
        List<Map<String, String>> rows = new ArrayList<>();
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)),
                StandardCharsets.UTF_8); CSVParser parser = CSVParser.parse(reader, format)) {
            List<String> headers = parser.getHeaderNames();
            for (CSVRecord record : parser) {
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size() && i < record.size(); i++) {
                    row.put(headers.get(i), record.get(i));
                }
                addIfNotBlank(rows, row);
            }
        }
        return rows;
    }

    private static List<Map<String, String>> readXlsx(byte[] content) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                return rows;
            }
            List<String> headers = new ArrayList<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                headers.add(formatter.formatCellValue(headerRow.getCell(c)).strip());
            }
            for (int r = sheet.getFirstRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                Row source = sheet.getRow(r);
                if (source == null) {
                    continue;
                }
                Map<String, String> row = new LinkedHashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    Cell cell = source.getCell(c);
                    row.put(headers.get(c), cell == null ? "" : formatter.formatCellValue(cell).strip());
                }
                addIfNotBlank(rows, row);
            }
        }
        return rows;
    }

    private static void addIfNotBlank(List<Map<String, String>> rows, Map<String, String> row) {
        if (row.values().stream().anyMatch(v -> v != null && !v.isBlank())) {
            rows.add(row);
        }
    }

    /** Excel exports CSV with ';' in locales that use ',' as decimal separator. */
    private static char detectDelimiter(String text) {
        int end = text.indexOf('\n');
        String header = end < 0 ? text : text.substring(0, end);
        return header.chars().filter(c -> c == ';').count() > header.chars().filter(c -> c == ',').count() ? ';' : ',';
    }

    private static byte[] stripBom(byte[] content) {
        if (content.length >= 3 && content[0] == UTF8_BOM[0] && content[1] == UTF8_BOM[1] && content[2] == UTF8_BOM[2]) {
            byte[] stripped = new byte[content.length - 3];
            System.arraycopy(content, 3, stripped, 0, stripped.length);
            return stripped;
        }
        return content;
    }
}
