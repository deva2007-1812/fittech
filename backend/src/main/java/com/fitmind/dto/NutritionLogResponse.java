package com.fitmind.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NutritionLogResponse {
    private String date;
    private List<FoodLogResponse> entries;
    private MacroTotals totals;
}
