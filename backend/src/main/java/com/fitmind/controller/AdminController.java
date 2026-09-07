package com.fitmind.controller;

import com.fitmind.dto.FoodResponse;
import com.fitmind.dto.admin.*;
import com.fitmind.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "Administration operations for users, stats, and foods")
@SecurityRequirement(name = "Bearer Auth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Get system-wide platform statistics")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/users")
    @Operation(summary = "Get all registered users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/role")
    @Operation(summary = "Update a user's role (USER / ADMIN)")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Delete a user account and associated logs")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/activity")
    @Operation(summary = "Get recent logs and activity for a specific user")
    public ResponseEntity<AdminUserActivityResponse> getUserActivity(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.getUserActivity(userId));
    }

    @PostMapping("/foods")
    @Operation(summary = "Add a new food item to the master database")
    public ResponseEntity<FoodResponse> addFood(@Valid @RequestBody FoodAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addFood(request));
    }

    @PutMapping("/foods/{foodId}")
    @Operation(summary = "Update an existing food item in the master database")
    public ResponseEntity<FoodResponse> updateFood(
            @PathVariable UUID foodId,
            @Valid @RequestBody FoodAdminRequest request) {
        return ResponseEntity.ok(adminService.updateFood(foodId, request));
    }

    @DeleteMapping("/foods/{foodId}")
    @Operation(summary = "Delete a food item from the master database")
    public ResponseEntity<Void> deleteFood(@PathVariable UUID foodId) {
        adminService.deleteFood(foodId);
        return ResponseEntity.noContent().build();
    }
}
