package com.stockhub.barcode.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.barcode.domain.model.Symbology;
import com.stockhub.barcode.domain.service.BarcodeValueGenerator;
import org.junit.jupiter.api.Test;

class BarcodeValueGeneratorTest {

    @Test
    void generatesInStoreEan13WithValidCheckDigit() {
        String value = BarcodeValueGenerator.generate(Symbology.EAN13, 42);
        assertThat(value).hasSize(13).startsWith("200000000042");
        int expected = BarcodeValueGenerator.gs1CheckDigit(value.substring(0, 12));
        assertThat(value.charAt(12) - '0').isEqualTo(expected);
    }

    @Test
    void knownGs1CheckDigits() {
        assertThat(BarcodeValueGenerator.gs1CheckDigit("400638133393")).isEqualTo(1);
        assertThat(BarcodeValueGenerator.gs1CheckDigit("03600029145")).isEqualTo(2);
    }

    @Test
    void generatesCode128FromCounter() {
        assertThat(BarcodeValueGenerator.generate(Symbology.CODE128, 7)).isEqualTo("SH0000000007");
    }

    @Test
    void refusesUnsupportedFormatsAndExhaustedRange() {
        assertThatThrownBy(() -> BarcodeValueGenerator.generate(Symbology.UPC_A, 1)).extracting("code")
                .isEqualTo("BARCODE_FORMAT_NOT_GENERATABLE");
        assertThatThrownBy(() -> BarcodeValueGenerator.generate(Symbology.EAN13, 10_000_000_000L)).extracting("code")
                .isEqualTo("BARCODE_RANGE_EXHAUSTED");
    }
}
