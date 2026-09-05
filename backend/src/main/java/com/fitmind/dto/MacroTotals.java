package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MacroTotals {
    private double calories;
    private double protein;
    private double carbs;
    private double fat;
}
