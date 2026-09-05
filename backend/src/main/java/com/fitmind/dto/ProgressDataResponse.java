package com.fitmind.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressDataResponse {
    private List<WeightEntryResponse> weightHistory;
    private List<Map<String, Object>> calorieHistory;
    private List<Map<String, Object>> waterHistory;
    private List<Map<String, Object>> sleepHistory;
    private List<Map<String, Object>> workoutHistory;
}
