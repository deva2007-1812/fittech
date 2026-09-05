package com.fitmind.dto;

import com.fitmind.entity.MealType;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodLogRequest {

    @NotBlank(message = "Food name is required")
    @Size(max = 200, message = "Food name must be at most 200 characters")
    private String foodName;

    @NotBlank(message = "Quantity is required")
    private String quantity;

    private MealType mealType;

    private String date; // ISO date yyyy-MM-dd, defaults to today
}
