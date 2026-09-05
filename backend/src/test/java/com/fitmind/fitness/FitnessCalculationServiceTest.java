package com.fitmind.fitness;

import com.fitmind.entity.ActivityLevel;
import com.fitmind.entity.FitnessGoal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("FitnessCalculationService Unit Tests")
class FitnessCalculationServiceTest {

    private FitnessCalculationService service;

    @BeforeEach
    void setUp() {
        service = new FitnessCalculationService();
    }

    @Test
    @DisplayName("BMR calculation is correct for standard values")
    void testBMR() {
        // 70kg, 175cm, 25 years old
        double bmr = service.calculateBMR(70, 175, 25);
        // Mifflin-St Jeor: 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
        assertThat(bmr).isCloseTo(1673.75, within(1.0));
    }

    @Test
    @DisplayName("TDEE scales correctly with activity level")
    void testTDEE() {
        double bmr = 1600.0;
        double sedentaryTdee = service.calculateTDEE(bmr, ActivityLevel.SEDENTARY);
        double activeTdee = service.calculateTDEE(bmr, ActivityLevel.VERY_ACTIVE);

        assertThat(sedentaryTdee).isCloseTo(1920.0, within(1.0)); // 1600 * 1.2
        assertThat(activeTdee).isCloseTo(2760.0, within(1.0));    // 1600 * 1.725
        assertThat(activeTdee).isGreaterThan(sedentaryTdee);
    }

    @Test
    @DisplayName("Calorie target respects safety floor of 1200")
    void testCalorieTargetSafetyFloor() {
        // Very low TDEE – ensure we never go below 1200
        double tinyTdee = 800.0;
        int target = service.calculateDailyCalorieTarget(tinyTdee, FitnessGoal.WEIGHT_MANAGEMENT);
        assertThat(target).isGreaterThanOrEqualTo(1200);
    }

    @Test
    @DisplayName("Weight management goal reduces calorie target")
    void testWeightManagementGoal() {
        double tdee = 2200.0;
        int maintainTarget = service.calculateDailyCalorieTarget(tdee, FitnessGoal.MAINTAIN_WEIGHT);
        int weightMgmtTarget = service.calculateDailyCalorieTarget(tdee, FitnessGoal.WEIGHT_MANAGEMENT);
        assertThat(weightMgmtTarget).isLessThan(maintainTarget);
    }

    @Test
    @DisplayName("Improve fitness goal increases calorie target")
    void testImproveFitnessGoal() {
        double tdee = 2200.0;
        int maintainTarget = service.calculateDailyCalorieTarget(tdee, FitnessGoal.MAINTAIN_WEIGHT);
        int fitnessTarget = service.calculateDailyCalorieTarget(tdee, FitnessGoal.IMPROVE_FITNESS);
        assertThat(fitnessTarget).isGreaterThanOrEqualTo(maintainTarget);
    }

    @Test
    @DisplayName("Protein target scales with body weight")
    void testProteinTarget() {
        double protein70kg = service.calculateProteinTarget(70, FitnessGoal.MAINTAIN_WEIGHT);
        double protein90kg = service.calculateProteinTarget(90, FitnessGoal.MAINTAIN_WEIGHT);
        assertThat(protein90kg).isGreaterThan(protein70kg);
        // 70kg * 1.6 = 112g
        assertThat(protein70kg).isCloseTo(112.0, within(1.0));
    }

    @Test
    @DisplayName("Fat target is approximately 25% of calories")
    void testFatTarget() {
        double fat = service.calculateFatTarget(2000);
        // 2000 * 0.25 / 9 ≈ 55.6g
        assertThat(fat).isCloseTo(55.6, within(1.0));
    }

    @Test
    @DisplayName("Carb target fills remaining calories")
    void testCarbTarget() {
        double carbs = service.calculateCarbTarget(2000, 112, 55);
        // Remaining = 2000 - (112*4) - (55*9) = 2000 - 448 - 495 = 1057 kcal / 4 ≈ 264g
        assertThat(carbs).isGreaterThan(200);
        assertThat(carbs).isLessThan(350);
    }
}
