package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodResponse {
    private String id;
    private String name;
    private Double servingSize;
    private String servingUnit;
    private Double calories;
    private Double protein;
    private Double carbohydrates;
    private Double fat;
    private Double fiber;
}
