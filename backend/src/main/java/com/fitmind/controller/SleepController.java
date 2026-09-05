package com.fitmind.controller;

import com.fitmind.dto.*;
import com.fitmind.service.SleepService;
import com.fitmind.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sleep")
@RequiredArgsConstructor
@Tag(name = "Sleep", description = "Sleep tracking")
@SecurityRequirement(name = "Bearer Auth")
public class SleepController {

    private final SleepService sleepService;
    private final AuthUtils authUtils;

    @PostMapping
    @Operation(summary = "Log sleep")
    public ResponseEntity<SleepEntryResponse> logSleep(@Valid @RequestBody SleepRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sleepService.logSleep(authUtils.getCurrentUserId(), request));
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's sleep entry")
    public ResponseEntity<SleepEntryResponse> getTodaySleep() {
        SleepEntryResponse sleep = sleepService.getTodaySleep(authUtils.getCurrentUserId());
        return sleep != null ? ResponseEntity.ok(sleep) : ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    @Operation(summary = "Get sleep history for the last N days")
    public ResponseEntity<List<SleepEntryResponse>> getHistory(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(sleepService.getHistory(authUtils.getCurrentUserId(), days));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a sleep entry")
    public ResponseEntity<Void> deleteSleep(@PathVariable UUID id) {
        sleepService.deleteSleep(authUtils.getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
