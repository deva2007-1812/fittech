package com.fitmind.fitness;

import com.fitmind.entity.ActivityLevel;
import com.fitmind.entity.FitnessGoal;
import com.fitmind.entity.UserProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Fitness calculation engine using the Mifflin-St Jeor equation.
 * All calculations remain server-side — never in the React frontend.
 */
@Service
@Slf4j
public class FitnessCalculationService {

    // Activity multipliers
    private static final double SEDENTARY = 1.2;
    private static final double LIGHTLY_ACTIVE = 1.375;
    private static final double MODERATELY_ACTIVE = 1.55;
    private static final double VERY_ACTIVE = 1.725;
    private static final double EXTRA_ACTIVE = 1.9;

    /**
     * BMR using Mifflin-St Jeor (assumes male by default; gender not collected to keep profile simple)
     * Formula: 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
     */
    public double calculateBMR(double weightKg, double heightCm, int age) {
        return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    }

    /**
     * TDEE = BMR × Activity Multiplier
     */
    public double calculateTDEE(double bmr, ActivityLevel activityLevel) {
        double multiplier = switch (activityLevel) {
            case SEDENTARY -> SEDENTARY;
            case LIGHTLY_ACTIVE -> LIGHTLY_ACTIVE;
            case MODERATELY_ACTIVE -> MODERATELY_ACTIVE;
            case VERY_ACTIVE -> VERY_ACTIVE;
            case EXTRA_ACTIVE -> EXTRA_ACTIVE;
        };
        return bmr * multiplier;
    }

    /**
     * Adjust calorie target based on fitness goal.
     * We keep adjustments moderate to avoid unsafe recommendations.
     */
    public int calculateDailyCalorieTarget(double tdee, FitnessGoal goal) {
        double adjusted = switch (goal) {
            case WEIGHT_MANAGEMENT -> tdee - 400;   // mild deficit
            case MAINTAIN_WEIGHT   -> tdee;
            case IMPROVE_FITNESS   -> tdee + 200;   // slight surplus for muscle
        };
        // Safety floor – never below 1200
        return (int) Math.max(1200, Math.round(adjusted));
    }

    /** Protein: 1.6g per kg body weight (performance-based) */
    public double calculateProteinTarget(double weightKg, FitnessGoal goal) {
        double multiplier = switch (goal) {
            case IMPROVE_FITNESS   -> 1.8;
            case MAINTAIN_WEIGHT   -> 1.6;
            case WEIGHT_MANAGEMENT -> 1.8; // higher protein preserves muscle on deficit
        };
        return round(weightKg * multiplier);
    }

    /** Fat: 25-30% of calories → 25% used as baseline */
    public double calculateFatTarget(int calories) {
        return round((calories * 0.25) / 9.0);
    }

    /** Carbs: remaining calories after protein and fat */
    public double calculateCarbTarget(int calories, double proteinGrams, double fatGrams) {
        double remaining = calories - (proteinGrams * 4) - (fatGrams * 9);
        return round(Math.max(50, remaining / 4.0));
    }

    /**
     * Populate a UserProfile with computed targets.
     */
    public void applyTargets(UserProfile profile) {
        if (profile.getWeight() == null || profile.getHeight() == null || profile.getAge() == null) {
            return; // cannot calculate without complete data
        }

        double weightKg = profile.getWeight().doubleValue();
        double heightCm = profile.getHeight().doubleValue();
        int age = profile.getAge();
        ActivityLevel activityLevel = profile.getActivityLevel() != null
                ? profile.getActivityLevel() : ActivityLevel.MODERATELY_ACTIVE;
        FitnessGoal goal = profile.getFitnessGoal() != null
                ? profile.getFitnessGoal() : FitnessGoal.MAINTAIN_WEIGHT;

        double bmr = calculateBMR(weightKg, heightCm, age);
        double tdee = calculateTDEE(bmr, activityLevel);
        int calories = calculateDailyCalorieTarget(tdee, goal);
        double protein = calculateProteinTarget(weightKg, goal);
        double fat = calculateFatTarget(calories);
        double carbs = calculateCarbTarget(calories, protein, fat);

        profile.setDailyCalorieTarget(calories);
        profile.setDailyProteinTarget(BigDecimal.valueOf(protein));
        profile.setDailyCarbohydrateTarget(BigDecimal.valueOf(carbs));
        profile.setDailyFatTarget(BigDecimal.valueOf(fat));

        log.debug("Calculated targets – Cal:{} Protein:{}g Carbs:{}g Fat:{}g",
                calories, protein, carbs, fat);
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
