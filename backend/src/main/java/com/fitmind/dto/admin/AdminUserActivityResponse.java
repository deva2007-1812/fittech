package com.fitmind.dto.admin;

import com.fitmind.dto.FoodLogResponse;
import com.fitmind.dto.SleepEntryResponse;
import com.fitmind.dto.WaterEntryResponse;
import com.fitmind.dto.WorkoutResponse;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserActivityResponse {
    private String userId;
    private String userName;
    private String userEmail;
    private List<FoodLogResponse> recentFoodLogs;
    private List<WorkoutResponse> recentWorkoutLogs;
    private List<WaterEntryResponse> recentWaterLogs;
    private List<SleepEntryResponse> recentSleepLogs;
}
