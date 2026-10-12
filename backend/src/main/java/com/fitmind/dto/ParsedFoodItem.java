package com.fitmind.dto;

import com.fitmind.entity.MealType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParsedFoodItem {
    private String foodName;
    private Double quantity;
    private String unit;
    private MealType mealType;
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
}
