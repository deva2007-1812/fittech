package com.fitmind.ai;

import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.repository.*;
import com.fitmind.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

/**
 * Assembles a structured context object from user data before every AI call.
 * Keeps AI prompts data-rich but concise to avoid unnecessary API costs.
 */
@Service
@RequiredArgsConstructor
public class AiContextService {

    private final UserProfileRepository userProfileRepository;
    private final NutritionService nutritionService;
    private final WorkoutService workoutService;
    private final WaterService waterService;
    private final SleepService sleepService;
    private final WeightService weightService;
    private final UserService userService;

    public String buildContext(UUID userId) {
        StringBuilder ctx = new StringBuilder();

        // Profile
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            ctx.append("USER PROFILE:\n");
            if (profile.getAge() != null) ctx.append("- Age: ").append(profile.getAge()).append("\n");
            if (profile.getWeight() != null) ctx.append("- Weight: ").append(profile.getWeight()).append(" kg\n");
            if (profile.getHeight() != null) ctx.append("- Height: ").append(profile.getHeight()).append(" cm\n");
            if (profile.getActivityLevel() != null) ctx.append("- Activity: ").append(profile.getActivityLevel()).append("\n");
            if (profile.getFitnessGoal() != null) ctx.append("- Goal: ").append(profile.getFitnessGoal()).append("\n");
            if (profile.getDailyCalorieTarget() != null) ctx.append("- Calorie target: ").append(profile.getDailyCalorieTarget()).append(" kcal\n");
            if (profile.getDailyProteinTarget() != null) ctx.append("- Protein target: ").append(profile.getDailyProteinTarget()).append(" g\n");
        });

        // Today's nutrition
        try {
            NutritionLogResponse todayNutrition = nutritionService.getTodayLog(userId);
            MacroTotals totals = todayNutrition.getTotals();
            ctx.append("\nTODAY'S NUTRITION (").append(LocalDate.now()).append("):\n");
            ctx.append("- Calories: ").append(totals.getCalories()).append(" kcal\n");
            ctx.append("- Protein: ").append(totals.getProtein()).append(" g\n");
            ctx.append("- Carbs: ").append(totals.getCarbs()).append(" g\n");
            ctx.append("- Fat: ").append(totals.getFat()).append(" g\n");
            ctx.append("- Meals logged: ").append(todayNutrition.getEntries().size()).append("\n");
        } catch (Exception ignored) {}

        // Today's workout
        try {
            List<WorkoutResponse> workouts = workoutService.getTodayWorkouts(userId);
            if (!workouts.isEmpty()) {
                ctx.append("\nTODAY'S WORKOUTS:\n");
                workouts.forEach(w -> ctx.append("- ").append(w.getExercise())
                        .append(" for ").append(w.getDuration()).append(" min\n"));
            }
        } catch (Exception ignored) {}

        // Water intake
        try {
            WaterLogResponse waterLog = waterService.getTodayLog(userId);
            ctx.append("\nWATER INTAKE: ").append(waterLog.getTotalAmount())
               .append(" ml / ").append(waterLog.getDailyTarget()).append(" ml target\n");
        } catch (Exception ignored) {}

        // Sleep
        try {
            SleepEntryResponse sleep = sleepService.getTodaySleep(userId);
            if (sleep != null) {
                ctx.append("\nSLEEP: ").append(sleep.getDuration()).append(" hours last night\n");
            }
        } catch (Exception ignored) {}

        // Current weight
        try {
            Double weight = weightService.getLatestWeight(userId);
            if (weight != null) {
                ctx.append("\nCURRENT WEIGHT: ").append(weight).append(" kg\n");
            }
        } catch (Exception ignored) {}

        return ctx.toString();
    }

    public String buildWeeklyContext(UUID userId) {
        StringBuilder ctx = new StringBuilder("WEEKLY SUMMARY (last 7 days):\n");

        try {
            List<NutritionLogResponse> history = nutritionService.getHistory(userId, 7);
            double avgCal = history.stream()
                    .mapToDouble(d -> d.getTotals().getCalories()).average().orElse(0);
            ctx.append("- Avg daily calories: ").append(Math.round(avgCal)).append(" kcal\n");
        } catch (Exception ignored) {}

        try {
            List<Map<String, Object>> waterHistory = waterService.getHistory(userId, 7);
            double avgWater = waterHistory.stream()
                    .mapToDouble(d -> ((Number) d.get("amount")).doubleValue()).average().orElse(0);
            ctx.append("- Avg daily water: ").append(Math.round(avgWater)).append(" ml\n");
        } catch (Exception ignored) {}

        try {
            List<SleepEntryResponse> sleepHistory = sleepService.getHistory(userId, 7);
            double avgSleep = sleepHistory.stream()
                    .mapToDouble(SleepEntryResponse::getDuration).average().orElse(0);
            ctx.append("- Avg sleep: ").append(String.format("%.1f", avgSleep)).append(" hours/night\n");
        } catch (Exception ignored) {}

        try {
            List<WorkoutResponse> workouts = workoutService.getHistory(userId, 7);
            ctx.append("- Workout sessions this week: ").append(workouts.size()).append("\n");
        } catch (Exception ignored) {}

        ctx.append(buildContext(userId));
        return ctx.toString();
    }
}
