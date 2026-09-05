package com.fitmind.dto;

import com.fitmind.entity.ActivityLevel;
import com.fitmind.entity.FitnessGoal;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    private String userId;
    private Integer age;
    private Double height;
    private Double weight;
    private ActivityLevel activityLevel;
    private FitnessGoal fitnessGoal;
    private Integer dailyCalorieTarget;
    private Double dailyProteinTarget;
    private Double dailyCarbohydrateTarget;
    private Double dailyFatTarget;
    private Integer dailyWaterTarget;
}
