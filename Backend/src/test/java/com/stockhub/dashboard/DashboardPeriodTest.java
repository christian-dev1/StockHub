package com.stockhub.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.stockhub.dashboard.domain.model.DashboardPeriod;
import com.stockhub.dashboard.domain.model.DashboardPeriod.Granularity;
import com.stockhub.shared.domain.exception.InvalidInputException;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

class DashboardPeriodTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 22);

    @Test
    void presetsEndTodayAndIncludeIt() {
        assertThat(DashboardPeriod.of("TODAY", null, null, TODAY))
                .extracting(DashboardPeriod::from, DashboardPeriod::to, DashboardPeriod::granularity)
                .containsExactly(TODAY, TODAY, Granularity.HOUR);
        assertThat(DashboardPeriod.of("7d", null, null, TODAY))
                .extracting(DashboardPeriod::from, DashboardPeriod::days, DashboardPeriod::granularity)
                .containsExactly(LocalDate.of(2026, 9, 16), 7L, Granularity.DAY);
        assertThat(DashboardPeriod.of("30D", null, null, TODAY).from())
                .isEqualTo(LocalDate.of(2026, 8, 24));
        assertThat(DashboardPeriod.of("3M", null, null, TODAY))
                .extracting(DashboardPeriod::from, DashboardPeriod::granularity)
                .containsExactly(LocalDate.of(2026, 6, 23), Granularity.WEEK);
        assertThat(DashboardPeriod.of("1Y", null, null, TODAY))
                .extracting(DashboardPeriod::from, DashboardPeriod::granularity)
                .containsExactly(LocalDate.of(2025, 9, 23), Granularity.MONTH);
    }

    @Test
    void defaultsToThirtyDays() {
        assertThat(DashboardPeriod.of(null, null, null, TODAY).code()).isEqualTo("30D");
    }

    @Test
    void customPeriodsPickTheirBucketSize() {
        assertThat(custom("2026-09-22", "2026-09-22").granularity()).isEqualTo(Granularity.HOUR);
        assertThat(custom("2026-09-01", "2026-09-22").granularity()).isEqualTo(Granularity.DAY);
        assertThat(custom("2026-05-01", "2026-09-22").granularity()).isEqualTo(Granularity.WEEK);
        assertThat(custom("2025-01-01", "2026-09-22").granularity()).isEqualTo(Granularity.MONTH);
    }

    @Test
    void rejectsInvalidPeriods() {
        assertThatThrownBy(() -> DashboardPeriod.of("2W", null, null, TODAY))
                .isInstanceOf(InvalidInputException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_PERIOD");
        assertThatThrownBy(() -> DashboardPeriod.of("CUSTOM", TODAY, null, TODAY))
                .isInstanceOf(InvalidInputException.class);
        assertThatThrownBy(() -> custom("2026-09-10", "2026-09-01"))
                .isInstanceOf(InvalidInputException.class);
        assertThatThrownBy(() -> custom("2026-09-10", "2026-09-23"))
                .isInstanceOf(InvalidInputException.class);
        assertThatThrownBy(() -> custom("2020-01-01", "2026-09-22"))
                .isInstanceOf(InvalidInputException.class);
    }

    private static DashboardPeriod custom(String from, String to) {
        return DashboardPeriod.of("CUSTOM", LocalDate.parse(from), LocalDate.parse(to), TODAY);
    }
}
