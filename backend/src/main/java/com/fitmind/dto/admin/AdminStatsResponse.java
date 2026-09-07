package com.fitmind.dto.admin;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long adminUsers;
    private long standardUsers;
    private long totalFoodLogs;
    private long totalWorkoutLogs;
    private long totalWaterLogs;
    private long totalSleepLogs;
    private long totalFoodsInDatabase;
}
