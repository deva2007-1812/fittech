package com.fitmind.dto;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutResponse {
    private String id;
    private String userId;
    private String exercise;
    private Integer duration;
    private Integer sets;
    private Integer reps;
    private String notes;
    private Double caloriesBurned;
    private String date;
    private OffsetDateTime createdAt;
}
