package com.stockhub.warehouse.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.warehouse.domain.model.Location;
import com.stockhub.warehouse.domain.model.LocationAddress;
import com.stockhub.warehouse.domain.model.LocationType;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LocationTest {

    private static final UUID COMPANY = UUID.randomUUID();

    @Test
    void primaryLocationIsNamedAfterTheCompany() {
        Location primary = Location.primaryFor(COMPANY, "Alpha Market", "Principal");
        assertThat(primary.name()).isEqualTo("Alpha Market - Principal");
        assertThat(primary.isPrimary()).isTrue();
        assertThat(primary.isActive()).isTrue();
    }

    @Test
    void primaryLocationCannotBeDeactivated() {
        Location primary = Location.primaryFor(COMPANY, "Alpha", "Principal");
        assertThatThrownBy(primary::deactivate).extracting("code").isEqualTo("LOCATION_PRIMARY_CANNOT_BE_DISABLED");
    }

    @Test
    void inactiveLocationCannotBecomePrimary() {
        Location depot = Location.create(COMPANY, "dep-1", "Dépôt", LocationType.DEPOT, LocationAddress.EMPTY);
        depot.deactivate();
        assertThatThrownBy(depot::makePrimary).extracting("code").isEqualTo("LOCATION_INACTIVE");
    }

    @Test
    void codeIsNormalisedAndValidated() {
        Location depot = Location.create(COMPANY, " wh-north ", "Nord", LocationType.WAREHOUSE, null);
        assertThat(depot.code()).isEqualTo("WH-NORTH");
        assertThatThrownBy(() -> Location.create(COMPANY, "wh north", "Nord", LocationType.WAREHOUSE, null))
                .extracting("code").isEqualTo("LOCATION_CODE_INVALID");
    }
}
