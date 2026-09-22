package com.stockhub.stock.application.usecase;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.stockhub.audit.AuditRecorder;
import com.stockhub.company.CompanySnapshot;
import com.stockhub.product.ProductSummary;
import com.stockhub.shared.application.SequenceGenerator;
import com.stockhub.stock.application.command.StockCommands.*;
import com.stockhub.stock.domain.model.*;
import com.stockhub.stock.domain.repository.*;

import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

class StockOperationsTest {
    UUID company = UUID.randomUUID(),
            productId = UUID.randomUUID(),
            source = UUID.randomUUID(),
            destination = UUID.randomUUID();
    StockContext context = mock(StockContext.class);
    StockLevelRepository levels = mock(StockLevelRepository.class);
    BatchRepository batches = mock(BatchRepository.class);
    StockMovementRepository ledger = mock(StockMovementRepository.class);
    SequenceGenerator sequences = mock(SequenceGenerator.class);
    AuditRecorder audit = mock(AuditRecorder.class);
    ProductSummary product = mock(ProductSummary.class);
    StockOperations operations =
            new StockOperations(context, levels, batches, ledger, sequences, audit);
    StockLevel stock;
    LocalDate today = LocalDate.of(2026, 10, 1);

    @BeforeEach
    void setup() {
        policy(false);
        when(product.id()).thenReturn(productId);
        when(product.sku()).thenReturn("P");
        when(product.unit()).thenReturn("UNIT");
        when(context.product(company, productId, "productId")).thenReturn(product);
        stock =
                new StockLevel(
                        UUID.randomUUID(), company, source, productId, new BigDecimal("3"), 0);
        when(levels.lock(company, source, productId)).thenReturn(stock);
        when(levels.lock(company, destination, productId))
                .thenReturn(StockLevel.empty(company, destination, productId));
    }

    void policy(boolean negative) {
        when(context.begin())
                .thenReturn(
                        new StockContext.Operation(
                                company,
                                UUID.randomUUID(),
                                "Actor",
                                new CompanySnapshot(
                                        company,
                                        "Company",
                                        "XAF",
                                        "Africa/Douala",
                                        "fr",
                                        true,
                                        negative,
                                        30,
                                        0),
                                Instant.parse("2026-10-01T12:00:00Z"),
                                today));
    }

    Exit exit(int quantity, UUID batch) {
        return new Exit(
                source,
                null,
                null,
                null,
                List.of(new OutLine(productId, BigDecimal.valueOf(quantity), batch)));
    }

    @Test
    void entryWithoutBatch() {
        operations.entry(
                new Entry(
                        source,
                        null,
                        null,
                        null,
                        List.of(new EntryLine(productId, BigDecimal.ONE, null, null, null))));
        assertThat(stock.quantity()).isEqualByComparingTo("4");
        verify(ledger).append(anyList());
        verify(audit).record(any());
    }

    @Test
    void exitRespectsNegativeDisabled() {
        assertThatThrownBy(() -> operations.exit(exit(5, null)))
                .hasMessageContaining("Insufficient");
        assertThat(stock.quantity()).isEqualByComparingTo("3");
        verify(ledger, never()).append(any());
    }

    @Test
    void exitRespectsNegativeEnabled() {
        policy(true);
        operations.exit(exit(5, null));
        assertThat(stock.quantity()).isEqualByComparingTo("-2");
    }

    @Test
    void trackedEntryRequiresBatch() {
        when(product.batchTracked()).thenReturn(true);
        assertThatThrownBy(
                        () ->
                                operations.entry(
                                        new Entry(
                                                source,
                                                null,
                                                null,
                                                null,
                                                List.of(
                                                        new EntryLine(
                                                                productId,
                                                                BigDecimal.ONE,
                                                                null,
                                                                null,
                                                                null)))))
                .hasMessageContaining("BATCH_REQUIRED");
    }

    @Test
    void expiredExplicitBatchIsRefused() {
        when(product.batchTracked()).thenReturn(true);
        var b = Batch.open(company, source, productId, "EXPIRED", null, today.minusDays(1));
        b.add(BigDecimal.TEN);
        when(batches.lockById(company, b.id())).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> operations.exit(exit(1, b.id()))).hasMessageContaining("expired");
        assertThat(stock.quantity()).isEqualByComparingTo("3");
    }

    @Test
    void transfer() {
        operations.transfer(
                new Transfer(
                        source,
                        destination,
                        null,
                        null,
                        List.of(new OutLine(productId, BigDecimal.ONE, null))));
        assertThat(stock.quantity()).isEqualByComparingTo("2");
        assertThat(levels.lock(company, destination, productId).quantity())
                .isEqualByComparingTo("1");
        verify(ledger)
                .append(
                        argThat(
                                ms ->
                                        ms.size() == 2
                                                && ms.get(0)
                                                        .documentId()
                                                        .equals(ms.get(1).documentId())));
    }

    @Test
    void sameLocation() {
        assertThatThrownBy(
                        () ->
                                operations.transfer(
                                        new Transfer(
                                                source,
                                                source,
                                                null,
                                                null,
                                                List.of(
                                                        new OutLine(
                                                                productId, BigDecimal.ONE, null)))))
                .hasMessageContaining("INVALID_TRANSFER");
        verifyNoInteractions(levels);
    }

    @Test
    void adjustment() {
        operations.adjustment(new Adjustment(source, productId, null, BigDecimal.ONE, "Count"));
        assertThat(stock.quantity()).isEqualByComparingTo("1");
    }

    @Test
    void negativeTrackedStockRemainsForbiddenToPreserveBatchSum() {
        policy(true);
        when(product.batchTracked()).thenReturn(true);
        when(batches.lockAvailable(company, source, productId)).thenReturn(List.of());
        assertThatThrownBy(() -> operations.exit(exit(5, null)))
                .hasMessageContaining("Insufficient");
    }

    @Test
    void numberingUsesCompanyTypeAndCompanyCalendarYear() {
        when(sequences.next(company, "STOCK_ENTRY", 2026)).thenReturn(42L);
        Entry command =
                new Entry(
                        source,
                        null,
                        null,
                        null,
                        List.of(new EntryLine(productId, BigDecimal.ONE, null, null, null)));
        assertThat(operations.entry(command).number()).isEqualTo("BE-2026-000042");
        when(context.begin())
                .thenReturn(
                        new StockContext.Operation(
                                company,
                                UUID.randomUUID(),
                                "Actor",
                                new CompanySnapshot(
                                        company,
                                        "Company",
                                        "XAF",
                                        "Africa/Douala",
                                        "fr",
                                        true,
                                        false,
                                        30,
                                        0),
                                Instant.parse("2026-12-31T23:30:00Z"),
                                LocalDate.of(2027, 1, 1)));
        when(sequences.next(company, "STOCK_ENTRY", 2027)).thenReturn(1L);
        assertThat(operations.entry(command).number()).isEqualTo("BE-2027-000001");
        verify(sequences).next(company, "STOCK_ENTRY", 2026);
        verify(sequences).next(company, "STOCK_ENTRY", 2027);
    }
}
