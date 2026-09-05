package com.fitmind.controller;

import com.fitmind.dto.*;
import com.fitmind.service.WaterService;
import com.fitmind.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/water")
@RequiredArgsConstructor
@Tag(name = "Water", description = "Water intake tracking")
@SecurityRequirement(name = "Bearer Auth")
public class WaterController {

    private final WaterService waterService;
    private final AuthUtils authUtils;

    @PostMapping
    @Operation(summary = "Log water intake")
    public ResponseEntity<WaterEntryResponse> addWater(@Valid @RequestBody WaterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(waterService.addWater(authUtils.getCurrentUserId(), request));
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's water log with total and entries")
    public ResponseEntity<WaterLogResponse> getTodayLog() {
        return ResponseEntity.ok(waterService.getTodayLog(authUtils.getCurrentUserId()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get water intake history by day")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(waterService.getHistory(authUtils.getCurrentUserId(), days));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a water log entry")
    public ResponseEntity<Void> deleteWater(@PathVariable UUID id) {
        waterService.deleteWater(authUtils.getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
