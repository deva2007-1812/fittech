package com.fitmind.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutRequest {

    @NotBlank(message = "Exercise name is required")
    @Size(max = 200, message = "Exercise name must be at most 200 characters")
    private String exercise;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 1440, message = "Duration cannot exceed 1440 minutes")
    private Integer duration; // minutes

    @Min(value = 1, message = "Sets must be positive")
    private Integer sets;

    @Min(value = 1, message = "Reps must be positive")
    private Integer reps;

    private String notes;

    private String date; // ISO date yyyy-MM-dd
}
