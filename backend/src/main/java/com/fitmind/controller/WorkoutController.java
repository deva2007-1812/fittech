package com.fitmind.controller;

import com.fitmind.dto.*;
import com.fitmind.service.WorkoutService;
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
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
@Tag(name = "Workouts", description = "Workout tracking")
@SecurityRequirement(name = "Bearer Auth")
public class WorkoutController {

    private final WorkoutService workoutService;
    private final AuthUtils authUtils;

    @PostMapping
    @Operation(summary = "Log a workout")
    public ResponseEntity<WorkoutResponse> addWorkout(@Valid @RequestBody WorkoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workoutService.addWorkout(authUtils.getCurrentUserId(), request));
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's workouts")
    public ResponseEntity<List<WorkoutResponse>> getTodayWorkouts() {
        return ResponseEntity.ok(workoutService.getTodayWorkouts(authUtils.getCurrentUserId()));
    }

    @GetMapping("/date/{date}")
    @Operation(summary = "Get workouts for a specific date (yyyy-MM-dd)")
    public ResponseEntity<List<WorkoutResponse>> getByDate(@PathVariable String date) {
        return ResponseEntity.ok(workoutService.getWorkoutsByDate(
                authUtils.getCurrentUserId(), LocalDate.parse(date)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get workout history for the last N days")
    public ResponseEntity<List<WorkoutResponse>> getHistory(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(workoutService.getHistory(authUtils.getCurrentUserId(), days));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a workout entry")
    public ResponseEntity<Void> deleteWorkout(@PathVariable UUID id) {
        workoutService.deleteWorkout(authUtils.getCurrentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
