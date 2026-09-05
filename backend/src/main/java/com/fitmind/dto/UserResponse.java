package com.fitmind.dto;

import com.fitmind.entity.ActivityLevel;
import com.fitmind.entity.FitnessGoal;
import lombok.*;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private String id;
    private String email;
    private String name;
    private Integer age;
    private Double height;
    private Double weight;
    private ActivityLevel activityLevel;
    private FitnessGoal fitnessGoal;
    private Boolean profileComplete;
    private OffsetDateTime createdAt;
}
