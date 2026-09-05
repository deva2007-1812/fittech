package com.fitmind.service;

import com.fitmind.ai.AiService;
import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final NutritionService nutritionService;
    private final WorkoutService workoutService;
    private final WaterService waterService;
    private final SleepService sleepService;
    private final WeightService weightService;
    private final AiService aiService;

    public DashboardResponse getDashboard(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        // Targets
        int calTarget = profile != null && profile.getDailyCalorieTarget() != null
                ? profile.getDailyCalorieTarget() : 2000;
        double proteinTarget = profile != null && profile.getDailyProteinTarget() != null
                ? profile.getDailyProteinTarget().doubleValue() : 150.0;
        double carbTarget = profile != null && profile.getDailyCarbohydrateTarget() != null
                ? profile.getDailyCarbohydrateTarget().doubleValue() : 250.0;
        double fatTarget = profile != null && profile.getDailyFatTarget() != null
                ? profile.getDailyFatTarget().doubleValue() : 55.0;
        int waterTarget = profile != null && profile.getDailyWaterTarget() != null
                ? profile.getDailyWaterTarget() : 2500;

        // Today's data
        NutritionLogResponse nutrition = nutritionService.getTodayLog(userId);
        MacroTotals totals = nutrition.getTotals();
        Integer workoutDuration = workoutService.getTotalDurationToday(userId);
        Integer waterAmount = waterService.getTotalToday(userId);
        Double sleepDuration = sleepService.getDurationToday(userId);
        Double currentWeight = weightService.getLatestWeight(userId);

        // AI insight (non-blocking fallback)
        String insight;
        try {
            AiInsightResponse aiInsight = aiService.getDailyInsight(userId);
            insight = aiInsight.getMessage();
        } catch (Exception e) {
            insight = "Keep up the great work! Stay consistent with your nutrition and workout goals.";
        }

        String goal = profile != null && profile.getFitnessGoal() != null
                ? profile.getFitnessGoal().name().toLowerCase().replace("_", " ") : "general wellness";

        return DashboardResponse.builder()
                .userName(user.getName())
                .fitnessGoal(goal)
                .caloriesConsumed(totals.getCalories())
                .calorieTarget(calTarget)
                .protein(totals.getProtein())
                .proteinTarget(proteinTarget)
                .carbs(totals.getCarbs())
                .carbTarget(carbTarget)
                .fat(totals.getFat())
                .fatTarget(fatTarget)
                .water(waterAmount)
                .waterTarget(waterTarget)
                .workoutDuration(workoutDuration)
                .sleepDuration(sleepDuration)
                .currentWeight(currentWeight)
                .aiInsight(insight)
                .build();
    }
}
