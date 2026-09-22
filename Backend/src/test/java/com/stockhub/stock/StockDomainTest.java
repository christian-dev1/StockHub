package com.stockhub.stock;

import static org.assertj.core.api.Assertions.*;

import com.stockhub.stock.domain.model.*;
import com.stockhub.stock.domain.service.BatchAllocator;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

class StockDomainTest {
    private StockLevel level(int quantity) {
        return new StockLevel(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                BigDecimal.valueOf(quantity),
                0);
    }

    private Batch batch(String number, int q, int days) {
        var b =
                Batch.open(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        number,
                        null,
                        LocalDate.of(2026, 10, 1).plusDays(days));
        b.add(BigDecimal.valueOf(q));
        return b;
    }

    @Test
    void entry() {
        var s = level(3);
        s.apply(MovementType.ENTRY, BigDecimal.valueOf(2), false, "P");
        assertThat(s.quantity()).isEqualByComparingTo("5");
    }

    @Test
    void exit() {
        var s = level(3);
        s.apply(MovementType.EXIT, BigDecimal.valueOf(2), false, "P");
        assertThat(s.quantity()).isEqualByComparingTo("1");
    }

    @Test
    void negativeDeniedWithoutMutation() {
        var s = level(3);
        assertThatThrownBy(() -> s.apply(MovementType.EXIT, BigDecimal.valueOf(5), false, "P"))
                .hasMessageContaining("Insufficient");
        assertThat(s.quantity()).isEqualByComparingTo("3");
    }

    @Test
    void negativeAllowed() {
        var s = level(3);
        s.apply(MovementType.EXIT, BigDecimal.valueOf(5), true, "P");
        assertThat(s.quantity()).isEqualByComparingTo("-2");
    }

    @Test
    void adjustments() {
        var s = level(3);
        s.apply(MovementType.ADJUSTMENT_POSITIVE, BigDecimal.valueOf(2), false, "P");
        s.apply(MovementType.ADJUSTMENT_NEGATIVE, BigDecimal.ONE, false, "P");
        assertThat(s.quantity()).isEqualByComparingTo("4");
    }

    @Test
    void quantities() {
        for (var q : List.of(BigDecimal.ZERO, BigDecimal.ONE.negate(), new BigDecimal("1.1")))
            assertThatThrownBy(() -> Quantities.requirePositive(q, "UNIT", "quantity"))
                    .isInstanceOf(RuntimeException.class);
    }

    @Test
    void batchRequired() {
        assertThatThrownBy(() -> batch(" ", 1, 1)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void expiration() {
        LocalDate day = LocalDate.of(2026, 10, 1);
        assertThat(ExpiryStatus.of(day.minusDays(1), day, 30)).isEqualTo(ExpiryStatus.EXPIRED);
        assertThat(ExpiryStatus.of(day.plusDays(20), day, 30))
                .isEqualTo(ExpiryStatus.EXPIRING_SOON);
        assertThat(ExpiryStatus.of(day.plusDays(31), day, 30)).isEqualTo(ExpiryStatus.VALID);
    }

    @Test
    void fefoMultiBatchExcludesExpired() {
        var a = batch("A", 3, 9);
        var b = batch("B", 5, 19);
        var c = batch("C", 10, 29);
        var expired = batch("OLD", 100, -1);
        var allocations =
                BatchAllocator.allocate(
                        List.of(c, b, expired, a),
                        BigDecimal.valueOf(7),
                        LocalDate.of(2026, 10, 1),
                        "P");
        assertThat(allocations).hasSize(2);
        allocations.forEach(x -> x.batch().remove(x.quantity(), "P"));
        assertThat(a.quantity()).isEqualByComparingTo("0");
        assertThat(b.quantity()).isEqualByComparingTo("1");
        assertThat(c.quantity()).isEqualByComparingTo("10");
        assertThat(expired.quantity()).isEqualByComparingTo("100");
    }

    @Test
    void insufficientValidBatches() {
        assertThatThrownBy(
                        () ->
                                BatchAllocator.allocate(
                                        List.of(batch("OLD", 100, -1)),
                                        BigDecimal.ONE,
                                        LocalDate.of(2026, 10, 1),
                                        "P"))
                .isInstanceOf(RuntimeException.class);
    }
}
