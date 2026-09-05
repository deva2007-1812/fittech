package com.fitmind.dto;

import com.fitmind.entity.MealType;
import lombok.*;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodLogResponse {
    private String id;
    private String userId;
    private String foodName;
    private String quantity;
    private String unit;
    private MealType mealType;
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private String date;
    private OffsetDateTime createdAt;
}
