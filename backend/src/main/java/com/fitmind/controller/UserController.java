package com.fitmind.controller;

import com.fitmind.dto.*;
import com.fitmind.service.UserService;
import com.fitmind.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile and onboarding")
@SecurityRequirement(name = "Bearer Auth")
public class UserController {

    private final UserService userService;
    private final AuthUtils authUtils;

    @GetMapping("/profile")
    @Operation(summary = "Get authenticated user's profile")
    public ResponseEntity<UserResponse> getProfile() {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getUserResponse(userId));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody ProfileRequest request) {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @PostMapping("/onboarding")
    @Operation(summary = "Complete onboarding with profile details")
    public ResponseEntity<UserResponse> completeOnboarding(@Valid @RequestBody ProfileRequest request) {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.completeOnboarding(userId, request));
    }

    @GetMapping("/daily-targets")
    @Operation(summary = "Get daily nutrition and water targets")
    public ResponseEntity<DailyTargetsResponse> getDailyTargets() {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getDailyTargets(userId));
    }

    // ─── Profile endpoint aliases (for /api/profile frontend route) ────────────

    @GetMapping("/me")
    @Operation(summary = "Get full profile with targets")
    public ResponseEntity<ProfileResponse> getFullProfile() {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getProfile(userId));
    }
}
