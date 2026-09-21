package com.stockhub.support;

import com.stockhub.StockHubApplication;
import org.springframework.boot.SpringApplication;

/** Runs the backend locally against a throw-away PostgreSQL container. */
public class TestStockHubApplication {

    public static void main(String[] args) {
        SpringApplication.from(StockHubApplication::main)
                .with(TestcontainersConfiguration.class)
                .withAdditionalProfiles("test")
                .run(args);
    }
}
