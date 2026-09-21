package com.stockhub.product.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.product.domain.valueobject.Unit;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ImportColumnsTest {

    @Test
    void matchesEnglishAndFrenchHeadersIgnoringAccentsAndCase() {
        Map<String, String> row = ImportColumns.canonical(Map.of(
                "Désignation", "Riz 5kg", "Prix de vente", "4 500", "Catégorie", "Épicerie", "Unknown", "x",
                "Code-barres", " "));
        assertThat(row).containsEntry(ImportColumns.NAME, "Riz 5kg")
                .containsEntry(ImportColumns.SALE_PRICE, "4 500")
                .containsEntry(ImportColumns.CATEGORY, "Épicerie")
                .doesNotContainKey(ImportColumns.BARCODE)
                .hasSize(3);
    }

    @Test
    void parsesLocalisedDecimals() {
        assertThat(ImportColumns.decimal("1 234,50")).hasValueSatisfying(v -> assertThat(v).isEqualByComparingTo("1234.50"));
        assertThat(ImportColumns.decimal("1,234.50")).hasValueSatisfying(v -> assertThat(v).isEqualByComparingTo("1234.50"));
        assertThat(ImportColumns.decimal("12")).hasValueSatisfying(v -> assertThat(v).isEqualByComparingTo("12"));
        assertThatThrownBy(() -> ImportColumns.decimal("douze")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void parsesBooleansAndUnits() {
        assertThat(ImportColumns.bool("Oui")).isTrue();
        assertThat(ImportColumns.bool("0")).isFalse();
        assertThat(ImportColumns.bool("")).isFalse();
        assertThat(ImportColumns.unit("Pièce")).isEqualTo(Unit.UNIT);
        assertThat(ImportColumns.unit("carton")).isEqualTo(Unit.BOX);
        assertThat(ImportColumns.unit("Litre")).isEqualTo(Unit.L);
        assertThatThrownBy(() -> ImportColumns.unit("barrel")).isInstanceOf(IllegalArgumentException.class);
    }
}
