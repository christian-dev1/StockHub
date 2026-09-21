package com.stockhub.product.application.usecase;

import com.stockhub.product.domain.valueobject.Unit;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Column vocabulary of the product import. Headers are matched ignoring case,
 * accents, spaces and punctuation, in English or French (e.g. {@code Prix de vente}).
 */
final class ImportColumns {

    static final String SKU = "sku";
    static final String NAME = "name";
    static final String DESCRIPTION = "description";
    static final String CATEGORY = "category";
    static final String SUPPLIER_CODE = "supplierCode";
    static final String UNIT = "unit";
    static final String PURCHASE_PRICE = "purchasePrice";
    static final String SALE_PRICE = "salePrice";
    static final String MIN_STOCK = "minStock";
    static final String REORDER_QUANTITY = "reorderQuantity";
    static final String BARCODE = "barcode";
    static final String BARCODE_FORMAT = "barcodeFormat";
    static final String BATCH_TRACKED = "batchTracked";
    static final String EXPIRY_TRACKED = "expiryTracked";

    /** Column order of the downloadable template. */
    static final List<String> TEMPLATE = List.of(SKU, NAME, DESCRIPTION, CATEGORY, SUPPLIER_CODE, UNIT,
            PURCHASE_PRICE, SALE_PRICE, MIN_STOCK, REORDER_QUANTITY, BARCODE, BARCODE_FORMAT, BATCH_TRACKED,
            EXPIRY_TRACKED);

    private static final Map<String, String> ALIASES = new HashMap<>();

    static {
        alias(SKU, "sku", "reference", "ref", "codearticle");
        alias(NAME, "name", "nom", "designation", "libelle", "produit");
        alias(DESCRIPTION, "description");
        alias(CATEGORY, "category", "categorie", "famille");
        alias(SUPPLIER_CODE, "suppliercode", "supplier", "fournisseur", "codefournisseur");
        alias(UNIT, "unit", "unite", "uom");
        alias(PURCHASE_PRICE, "purchaseprice", "prixachat", "prixdachat", "cout");
        alias(SALE_PRICE, "saleprice", "prixvente", "prixdevente", "prix");
        alias(MIN_STOCK, "minstock", "stockmin", "stockminimum", "seuil", "seuilmin", "seuilminimum");
        alias(REORDER_QUANTITY, "reorderquantity", "quantitereappro", "qtereappro", "quantitecommande");
        alias(BARCODE, "barcode", "codebarres", "codebarre", "ean", "gtin");
        alias(BARCODE_FORMAT, "barcodeformat", "formatcodebarres", "formatcodebarre");
        alias(BATCH_TRACKED, "batchtracked", "lots", "suivilots", "gestionlots", "suiviparlot");
        alias(EXPIRY_TRACKED, "expirytracked", "expiration", "suiviexpiration", "dlc", "peremption");
    }

    private ImportColumns() {
    }

    private static void alias(String column, String... keys) {
        for (String key : keys) {
            ALIASES.put(key, column);
        }
    }

    /** Re-keys a raw row by canonical column names; unknown columns are ignored. */
    static Map<String, String> canonical(Map<String, String> raw) {
        Map<String, String> row = new HashMap<>();
        raw.forEach((header, value) -> {
            String column = ALIASES.get(normalize(header));
            if (column != null && value != null && !value.isBlank()) {
                row.putIfAbsent(column, value.strip());
            }
        });
        return row;
    }

    static String normalize(String text) {
        String decomposed = Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    /** Accepts {@code 1234.5}, {@code 1 234,50} (French) and {@code 1,234.50} (English). */
    static Optional<BigDecimal> decimal(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        String compact = value.replaceAll("[\\s\\u00A0\\u202F]", "");
        if (compact.contains(",") && compact.contains(".")) {
            compact = compact.replace(",", "");
        } else {
            compact = compact.replace(',', '.');
        }
        try {
            return Optional.of(new BigDecimal(compact));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(value);
        }
    }

    static boolean bool(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return switch (normalize(value)) {
            case "true", "yes", "oui", "o", "y", "1", "x", "vrai" -> true;
            case "false", "no", "non", "n", "0", "faux" -> false;
            default -> throw new IllegalArgumentException(value);
        };
    }

    static Unit unit(String value) {
        if (value == null || value.isBlank()) {
            return Unit.UNIT;
        }
        return switch (normalize(value)) {
            case "unit", "unite", "u", "piece", "pieces", "pc", "pcs", "ea" -> Unit.UNIT;
            case "kg", "kilo", "kilogramme", "kilogram" -> Unit.KG;
            case "g", "gramme", "gram" -> Unit.G;
            case "l", "litre", "liter" -> Unit.L;
            case "ml", "millilitre", "milliliter" -> Unit.ML;
            case "m", "metre", "meter" -> Unit.M;
            case "box", "carton", "boite" -> Unit.BOX;
            case "pack", "paquet", "lot" -> Unit.PACK;
            default -> throw new IllegalArgumentException(value);
        };
    }
}
