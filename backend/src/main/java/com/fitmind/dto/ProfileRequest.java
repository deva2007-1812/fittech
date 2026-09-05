package com.fitmind.dto;

import com.fitmind.entity.ActivityLevel;
import com.fitmind.entity.FitnessGoal;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileRequest {

    @Min(value = 10, message = "Age must be at least 10")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    @DecimalMin(value = "50.0", message = "Height must be at least 50 cm")
    @DecimalMax(value = "300.0", message = "Height must be at most 300 cm")
    private Double height; // cm

    @DecimalMin(value = "10.0", message = "Weight must be at least 10 kg")
    @DecimalMax(value = "500.0", message = "Weight must be at most 500 kg")
    private Double weight; // kg

    private ActivityLevel activityLevel;

    private FitnessGoal fitnessGoal;
}
