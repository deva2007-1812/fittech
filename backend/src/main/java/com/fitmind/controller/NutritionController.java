package com.fitmind.controller;

import com.fitmind.dto.*;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
@Tag(name = "Nutrition", description = "Food logging and nutrition tracking")
@SecurityRequirement(name = "Bearer Auth")
public class NutritionController {

    private final NutritionService nutritionService;
    private final AuthUtils authUtils;

    @GetMapping("/today")
    @Operation(summary = "Get today's food log with totals")
    public ResponseEntity<NutritionLogResponse> getTodayLog() {
        return ResponseEntity.ok(nutritionService.getTodayLog(authUtils.getCurrentUserId()));
    }

    @GetMapping("/log/{date}")
    @Operation(summary = "Get food log for a specific date (yyyy-MM-dd)")
    public ResponseEntity<NutritionLogResponse> getLogByDate(@PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        return ResponseEntity.ok(nutritionService.getLogByDate(authUtils.getCurrentUserId(), localDate));
    }

    @GetMapping("/history")
    @Operation(summary = "Get nutrition history for the last N days")
    public ResponseEntity<List<NutritionLogResponse>> getHistory(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(nutritionService.getHistory(authUtils.getCurrentUserId(), days));
    }

    @PostMapping({"/entries", "/logs"})
    @Operation(summary = "Add a food entry by name")
    public ResponseEntity<FoodLogResponse> addEntry(@Valid @RequestBody FoodLogRequest request) {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(nutritionService.addFoodEntry(userId, request));
    }

    @DeleteMapping("/entries/{id}")
    @Operation(summary = "Delete a food log entry")
    public ResponseEntity<Void> deleteEntry(@PathVariable UUID id) {
        nutritionService.deleteFoodEntry(authUtils.getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
