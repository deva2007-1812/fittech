package com.fitmind.controller;

import com.fitmind.dto.ProfileRequest;
import com.fitmind.dto.ProfileResponse;
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
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "Fitness profile management")
@SecurityRequirement(name = "Bearer Auth")
public class ProfileController {

    private final UserService userService;
    private final AuthUtils authUtils;

    @GetMapping
    @Operation(summary = "Get fitness profile with computed targets")
    public ResponseEntity<ProfileResponse> getProfile() {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @RequestMapping(method = {RequestMethod.POST, RequestMethod.PUT})
    @Operation(summary = "Create or update fitness profile - triggers target recalculation")
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody ProfileRequest request) {
        UUID userId = authUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.saveProfile(userId, request));
    }
}
