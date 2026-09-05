package com.fitmind.controller;

import com.fitmind.dto.FoodResponse;
import com.fitmind.nutrition.NutritionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
@Tag(name = "Foods", description = "Food database search")
@SecurityRequirement(name = "Bearer Auth")
public class FoodController {

    private final NutritionService nutritionService;

    @GetMapping("/search")
    @Operation(summary = "Search food database by name")
    public ResponseEntity<List<FoodResponse>> search(
            @RequestParam String query) {
        return ResponseEntity.ok(nutritionService.searchFoods(query));
    }
}
