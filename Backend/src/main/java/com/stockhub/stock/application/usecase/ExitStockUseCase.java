package com.stockhub.stock.application.usecase;

import com.stockhub.stock.application.command.StockCommands.Exit;
import com.stockhub.stock.domain.model.StockDocument;

import org.springframework.stereotype.Service;

@Service
public class ExitStockUseCase {
    private final StockOperations operations;

    public ExitStockUseCase(StockOperations operations) {
        this.operations = operations;
    }

    public StockDocument execute(Exit command) {
        return operations.exit(command);
    }
}
