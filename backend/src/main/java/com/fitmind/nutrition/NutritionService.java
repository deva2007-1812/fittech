package com.fitmind.nutrition;

import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.exception.ResourceNotFoundException;
import com.fitmind.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NutritionService {

    private final FoodLogRepository foodLogRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;

    // ─── Food Search ─────────────────────────────────────────────────────────

    public List<FoodResponse> searchFoods(String query) {
        return foodRepository.searchByNameNative(query, 20)
                .stream()
                .map(this::toFoodResponse)
                .collect(Collectors.toList());
    }

    // ─── Today's Log ─────────────────────────────────────────────────────────

    public NutritionLogResponse getTodayLog(UUID userId) {
        return getLogByDate(userId, LocalDate.now());
    }

    public NutritionLogResponse getLogByDate(UUID userId, LocalDate date) {
        List<FoodLog> logs = foodLogRepository.findByUserIdAndDate(userId, date);
        return buildNutritionLog(date, logs);
    }

    public List<NutritionLogResponse> getHistory(UUID userId, int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);
        List<FoodLog> allLogs = foodLogRepository.findByUserIdAndDateRange(userId, from, to);

        return from.datesUntil(to.plusDays(1))
                .map(date -> {
                    List<FoodLog> dayLogs = allLogs.stream()
                            .filter(l -> l.getLoggedAt().toLocalDate().equals(date))
                            .collect(Collectors.toList());
                    return buildNutritionLog(date, dayLogs);
                })
                .collect(Collectors.toList());
    }

    // ─── Add Food Entry ───────────────────────────────────────────────────────

    @Transactional
    public FoodLogResponse addFoodEntry(UUID userId, FoodLogRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        LocalDate date = parseDate(request.getDate());
        double quantity = parseQuantity(request.getQuantity());
        MealType mealType = request.getMealType() != null ? request.getMealType() : MealType.SNACK;

        // Try to find food in database for accurate nutrition
        List<Food> matches = foodRepository.searchByNameNative(request.getFoodName(), 1);
        FoodLog log;

        if (!matches.isEmpty()) {
            Food food = matches.get(0);
            double ratio = quantity / food.getServingSize().doubleValue();
            log = FoodLog.builder()
                    .user(user)
                    .food(food)
                    .foodName(food.getName())
                    .quantity(BigDecimal.valueOf(quantity))
                    .unit(food.getServingUnit())
                    .mealType(mealType)
                    .calories(BigDecimal.valueOf(food.getCalories().doubleValue() * ratio))
                    .protein(BigDecimal.valueOf(food.getProtein().doubleValue() * ratio))
                    .carbohydrates(BigDecimal.valueOf(food.getCarbohydrates().doubleValue() * ratio))
                    .fat(BigDecimal.valueOf(food.getFat().doubleValue() * ratio))
                    .loggedAt(date.atStartOfDay().atOffset(ZoneOffset.UTC))
                    .build();
        } else {
            // Food not found – create entry with name only (user can provide manual data)
            log = FoodLog.builder()
                    .user(user)
                    .foodName(request.getFoodName())
                    .quantity(BigDecimal.valueOf(quantity))
                    .unit("serving")
                    .mealType(mealType)
                    .calories(BigDecimal.ZERO)
                    .protein(BigDecimal.ZERO)
                    .carbohydrates(BigDecimal.ZERO)
                    .fat(BigDecimal.ZERO)
                    .loggedAt(date.atStartOfDay().atOffset(ZoneOffset.UTC))
                    .build();
        }

        log = foodLogRepository.save(log);
        return toFoodLogResponse(log);
    }

    /**
     * Add a food entry with known nutrition values (used by AI food analysis).
     */
    @Transactional
    public FoodLogResponse addFoodEntryWithNutrition(UUID userId, String foodName, double quantity,
                                                      String unit, MealType mealType,
                                                      double calories, double protein,
                                                      double carbs, double fat,
                                                      Food food, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        FoodLog log = FoodLog.builder()
                .user(user)
                .food(food)
                .foodName(foodName)
                .quantity(BigDecimal.valueOf(quantity))
                .unit(unit)
                .mealType(mealType)
                .calories(BigDecimal.valueOf(calories))
                .protein(BigDecimal.valueOf(protein))
                .carbohydrates(BigDecimal.valueOf(carbs))
                .fat(BigDecimal.valueOf(fat))
                .loggedAt(date.atStartOfDay().atOffset(ZoneOffset.UTC))
                .build();

        return toFoodLogResponse(foodLogRepository.save(log));
    }

    @Transactional
    public void deleteFoodEntry(UUID userId, UUID entryId) {
        FoodLog log = foodLogRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food log entry", entryId.toString()));
        foodLogRepository.delete(log);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private NutritionLogResponse buildNutritionLog(LocalDate date, List<FoodLog> logs) {
        List<FoodLogResponse> entries = logs.stream().map(this::toFoodLogResponse).collect(Collectors.toList());
        MacroTotals totals = calculateTotals(logs);
        return NutritionLogResponse.builder()
                .date(date.toString())
                .entries(entries)
                .totals(totals)
                .build();
    }

    private MacroTotals calculateTotals(List<FoodLog> logs) {
        double cal = logs.stream().mapToDouble(l -> l.getCalories().doubleValue()).sum();
        double prot = logs.stream().mapToDouble(l -> l.getProtein().doubleValue()).sum();
        double carbs = logs.stream().mapToDouble(l -> l.getCarbohydrates().doubleValue()).sum();
        double fat = logs.stream().mapToDouble(l -> l.getFat().doubleValue()).sum();
        return new MacroTotals(round(cal), round(prot), round(carbs), round(fat));
    }

    public FoodLogResponse toFoodLogResponse(FoodLog log) {
        return FoodLogResponse.builder()
                .id(log.getId().toString())
                .userId(log.getUser().getId().toString())
                .foodName(log.getFoodName())
                .quantity(log.getQuantity().toPlainString())
                .unit(log.getUnit())
                .mealType(log.getMealType())
                .calories(round(log.getCalories().doubleValue()))
                .protein(round(log.getProtein().doubleValue()))
                .carbs(round(log.getCarbohydrates().doubleValue()))
                .fat(round(log.getFat().doubleValue()))
                .date(log.getLoggedAt().toLocalDate().toString())
                .createdAt(log.getLoggedAt())
                .build();
    }

    private FoodResponse toFoodResponse(Food food) {
        return FoodResponse.builder()
                .id(food.getId().toString())
                .name(food.getName())
                .servingSize(food.getServingSize().doubleValue())
                .servingUnit(food.getServingUnit())
                .calories(food.getCalories().doubleValue())
                .protein(food.getProtein().doubleValue())
                .carbohydrates(food.getCarbohydrates().doubleValue())
                .fat(food.getFat().doubleValue())
                .fiber(food.getFiber() != null ? food.getFiber().doubleValue() : 0.0)
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
    }

    private double parseQuantity(String quantity) {
        if (quantity == null) return 1.0;
        try {
            return Double.parseDouble(quantity.replaceAll("[^0-9.]", ""));
        } catch (NumberFormatException e) {
            return 1.0;
        }
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
