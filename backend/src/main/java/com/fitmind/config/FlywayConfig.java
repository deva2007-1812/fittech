package com.fitmind.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.info("Repairing Flyway schema history before migration...");
            flyway.repair();
            log.info("Executing Flyway migrations...");
            flyway.migrate();
            log.info("Flyway migrations executed successfully.");
        };
    }
}
