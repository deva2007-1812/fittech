package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParsedWorkoutItem {
    private String exercise;
    private Integer duration; // in minutes
    private Integer sets;
    private Integer reps;
    private Double caloriesBurned;
    private String notes;
}
