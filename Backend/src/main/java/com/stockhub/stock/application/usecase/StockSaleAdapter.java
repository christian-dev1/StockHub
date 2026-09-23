package com.stockhub.stock.application.usecase;

import com.stockhub.stock.StockSalePort;
import com.stockhub.stock.application.command.StockCommands;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
class StockSaleAdapter implements StockSalePort {
    private final StockOperations operations;

    StockSaleAdapter(StockOperations operations) {
        this.operations = operations;
    }

    @Override
    public IssuedSale issue(UUID locationId, String saleNumber, List<Line> lines) {
        var document =
                operations.sale(
                        locationId,
                        saleNumber,
                        lines.stream()
                                .map(l -> new StockCommands.OutLine(l.productId(), l.quantity(), null))
                                .toList());
        return new IssuedSale(document.id(), document.number(), document.performedByName());
    }
}
