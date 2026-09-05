package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTargetsResponse {
    private Integer calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private Integer water;
}
