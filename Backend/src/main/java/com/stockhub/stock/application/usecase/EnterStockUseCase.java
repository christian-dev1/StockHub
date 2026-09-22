package com.stockhub.stock.application.usecase;

import com.stockhub.stock.application.command.StockCommands.Entry;
import com.stockhub.stock.domain.model.StockDocument;

import org.springframework.stereotype.Service;

@Service
public class EnterStockUseCase {
    private final StockOperations operations;

    public EnterStockUseCase(StockOperations operations) {
        this.operations = operations;
    }

    public StockDocument execute(Entry command) {
        return operations.entry(command);
    }
}
