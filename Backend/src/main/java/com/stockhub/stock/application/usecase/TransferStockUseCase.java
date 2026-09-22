package com.stockhub.stock.application.usecase;

import com.stockhub.stock.application.command.StockCommands.Transfer;
import com.stockhub.stock.domain.model.StockDocument;

import org.springframework.stereotype.Service;

@Service
public class TransferStockUseCase {
    private final StockOperations operations;

    public TransferStockUseCase(StockOperations operations) {
        this.operations = operations;
    }

    public StockDocument execute(Transfer command) {
        return operations.transfer(command);
    }
}
