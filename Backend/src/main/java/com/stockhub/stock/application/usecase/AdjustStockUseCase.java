package com.stockhub.stock.application.usecase;

import com.stockhub.stock.application.command.StockCommands.Adjustment;
import com.stockhub.stock.domain.model.StockDocument;

import org.springframework.stereotype.Service;

@Service
public class AdjustStockUseCase {
    private final StockOperations operations;

    public AdjustStockUseCase(StockOperations operations) {
        this.operations = operations;
    }

    public StockDocument execute(Adjustment command) {
        return operations.adjustment(command);
    }
}
