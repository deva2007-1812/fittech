package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private String userName;
    private String fitnessGoal;
    private Double caloriesConsumed;
    private Integer calorieTarget;
    private Double protein;
    private Double proteinTarget;
    private Double carbs;
    private Double carbTarget;
    private Double fat;
    private Double fatTarget;
    private Integer water;
    private Integer waterTarget;
    private Integer workoutDuration;
    private Double sleepDuration;
    private Double currentWeight;
    private String aiInsight;
}
