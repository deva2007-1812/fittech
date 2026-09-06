package com.fitmind.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Health", description = "Service health check and uptime probe")
public class HealthController {

    @GetMapping({"/", "/api/health", "/health"})
    @Operation(summary = "Check backend service status")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "FitMind AI Backend",
            "version", "1.0.0",
            "timestamp", Instant.now().toString()
        ));
    }
}
