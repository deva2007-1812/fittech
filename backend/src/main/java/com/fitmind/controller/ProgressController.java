package com.fitmind.controller;

import com.fitmind.dto.*;
import com.fitmind.service.ProgressService;
import com.fitmind.service.WeightService;
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
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@Tag(name = "Progress", description = "Progress tracking and weight history")
@SecurityRequirement(name = "Bearer Auth")
public class ProgressController {

    private final WeightService weightService;
    private final ProgressService progressService;
    private final AuthUtils authUtils;

    @GetMapping({"", "/summary"})
    @Operation(summary = "Get all progress data for charts (range: 7d, 30d, 90d)")
    public ResponseEntity<ProgressDataResponse> getProgressData(
            @RequestParam(defaultValue = "7d") String range) {
        return ResponseEntity.ok(progressService.getProgressData(authUtils.getCurrentUserId(), range));
    }

    @PostMapping("/weight")
    @Operation(summary = "Log weight")
    public ResponseEntity<WeightEntryResponse> logWeight(@Valid @RequestBody WeightRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(weightService.logWeight(authUtils.getCurrentUserId(), request));
    }

    @GetMapping("/weight")
    @Operation(summary = "Get weight history")
    public ResponseEntity<List<WeightEntryResponse>> getWeightHistory(
            @RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(weightService.getHistory(authUtils.getCurrentUserId(), range));
    }
}
