package com.fitmind.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodAdminRequest {
    @NotBlank(message = "Food name is required")
    private String name;

    @NotNull(message = "Serving size is required")
    @PositiveOrZero(message = "Serving size must be >= 0")
    private Double servingSize;

    @NotBlank(message = "Serving unit is required")
    private String servingUnit;

    @NotNull(message = "Calories are required")
    @PositiveOrZero(message = "Calories must be >= 0")
    private Double calories;

    @NotNull(message = "Protein is required")
    @PositiveOrZero(message = "Protein must be >= 0")
    private Double protein;

    @NotNull(message = "Carbohydrates are required")
    @PositiveOrZero(message = "Carbohydrates must be >= 0")
    private Double carbohydrates;

    @NotNull(message = "Fat is required")
    @PositiveOrZero(message = "Fat must be >= 0")
    private Double fat;

    @PositiveOrZero(message = "Fiber must be >= 0")
    private Double fiber;
}
