package com.fitmind.controller;

import com.fitmind.dto.DashboardResponse;
import com.fitmind.service.DashboardService;
import com.fitmind.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Aggregated dashboard data")
@SecurityRequirement(name = "Bearer Auth")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthUtils authUtils;

    @GetMapping
    @Operation(summary = "Get full dashboard data for today")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard(authUtils.getCurrentUserId()));
    }
}
