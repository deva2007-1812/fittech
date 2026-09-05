package com.fitmind.dto;

import com.fitmind.entity.MealType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceNutritionRequest {
    private String transcript;
    private MealType mealType;
}
