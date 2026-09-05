package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParsedFoodItem {
    private String foodName;
    private Double quantity;
    private String unit;
}
