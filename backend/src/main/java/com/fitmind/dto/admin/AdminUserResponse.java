package com.fitmind.dto.admin;

import com.fitmind.entity.ActivityLevel;
import com.fitmind.entity.FitnessGoal;
import lombok.*;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private String id;
    private String name;
    private String email;
    private String role;
    private Integer age;
    private Double height;
    private Double weight;
    private ActivityLevel activityLevel;
    private FitnessGoal fitnessGoal;
    private Integer dailyCalorieTarget;
    private Integer dailyWaterTarget;
    private Boolean profileComplete;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private long totalFoodLogsCount;
    private long totalWorkoutLogsCount;
}
