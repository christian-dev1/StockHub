package com.stockhub.supplier.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.supplier.domain.model.Supplier;
import com.stockhub.supplier.domain.valueobject.SupplierContact;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SupplierTest {

    @Test
    void normalisesCodeEmailAndCountry() {
        Supplier supplier = Supplier.create(UUID.randomUUID(), "sup-01", "Brasseries du Cameroun",
                new SupplierContact("Jean", " Ventes@SABC.cm ", null, null, "Douala", "cm"), null, 5, null);
        assertThat(supplier.code()).isEqualTo("SUP-01");
        assertThat(supplier.contact().email()).isEqualTo("ventes@sabc.cm");
        assertThat(supplier.contact().country()).isEqualTo("CM");
    }

    @Test
    void validatesLeadTimeAndEmail() {
        UUID company = UUID.randomUUID();
        assertThatThrownBy(() -> Supplier.create(company, "S", "X", new SupplierContact(null, null, null, null, null, null),
                null, 400, null)).extracting("code").isEqualTo("SUPPLIER_LEAD_TIME_INVALID");
        assertThatThrownBy(() -> new SupplierContact(null, "not-an-email", null, null, null, null)).extracting("code")
                .isEqualTo("EMAIL_INVALID");
    }
}
