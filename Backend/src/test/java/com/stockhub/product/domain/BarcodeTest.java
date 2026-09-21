package com.stockhub.product.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.product.domain.valueobject.Barcode;
import com.stockhub.product.domain.valueobject.BarcodeFormat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class BarcodeTest {

    @ParameterizedTest
    @CsvSource({"4006381333931, EAN13", "96385074, EAN8", "036000291452, UPC_A", "5449000000996, EAN13"})
    void acceptsGtinsWithValidCheckDigit(String value, BarcodeFormat format) {
        assertThat(new Barcode(value, format).value()).isEqualTo(value);
    }

    @Test
    void rejectsWrongCheckDigit() {
        assertThatThrownBy(() -> new Barcode("4006381333932", BarcodeFormat.EAN13)).extracting("code")
                .isEqualTo("PRODUCT_BARCODE_INVALID_CHECK_DIGIT");
    }

    @Test
    void rejectsWrongLengthOrNonDigits() {
        assertThatThrownBy(() -> new Barcode("400638133393", BarcodeFormat.EAN13)).extracting("code")
                .isEqualTo("PRODUCT_BARCODE_INVALID_LENGTH");
        assertThatThrownBy(() -> new Barcode("40063813339AB", BarcodeFormat.EAN13)).extracting("code")
                .isEqualTo("PRODUCT_BARCODE_INVALID_LENGTH");
    }

    @Test
    void code128AcceptsPrintableAsciiOnly() {
        assertThat(new Barcode(" ABC-123/x ", BarcodeFormat.CODE128).value()).isEqualTo("ABC-123/x");
        assertThatThrownBy(() -> new Barcode("café", BarcodeFormat.CODE128)).extracting("code")
                .isEqualTo("PRODUCT_BARCODE_INVALID_CHARACTERS");
        assertThatThrownBy(() -> new Barcode("A".repeat(65), BarcodeFormat.CODE128)).extracting("code")
                .isEqualTo("PRODUCT_BARCODE_TOO_LONG");
    }

    @Test
    void detectsSymbologyFromScannedValue() {
        assertThat(Barcode.detect("4006381333931").format()).isEqualTo(BarcodeFormat.EAN13);
        assertThat(Barcode.detect("036000291452").format()).isEqualTo(BarcodeFormat.UPC_A);
        assertThat(Barcode.detect("96385074").format()).isEqualTo(BarcodeFormat.EAN8);
        assertThat(Barcode.detect("SH0000000001").format()).isEqualTo(BarcodeFormat.CODE128);
        assertThat(Barcode.detect("123456").format()).isEqualTo(BarcodeFormat.CODE128);
    }

    @Test
    void numericValueOfGtinLengthWithWrongCheckDigitIsATypo() {
        assertThatThrownBy(() -> Barcode.detect("4006381333932")).extracting("code")
                .isEqualTo("PRODUCT_BARCODE_INVALID_CHECK_DIGIT");
    }

    @Test
    void computesGs1CheckDigit() {
        assertThat(Barcode.checkDigit("400638133393")).isEqualTo(1);
        assertThat(Barcode.checkDigit("9638507")).isEqualTo(4);
    }
}
