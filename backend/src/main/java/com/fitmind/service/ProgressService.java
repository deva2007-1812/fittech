package com.fitmind.service;

import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final WeightHistoryRepository weightHistoryRepository;
    private final UserProfileRepository userProfileRepository;
    private final FoodLogRepository foodLogRepository;
    private final WaterLogRepository waterLogRepository;
    private final SleepLogRepository sleepLogRepository;
    private final WorkoutLogRepository workoutLogRepository;

    public ProgressDataResponse getProgressData(UUID userId, String range) {
        int days = switch (range) {
            case "30d" -> 30;
            case "90d" -> 90;
            default -> 7;
        };
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);

        // Weight history (chronological)
        List<WeightEntryResponse> weightHistory = weightHistoryRepository
                .findByUserIdAndDateRange(userId, from, to)
                .stream()
                .map(w -> WeightEntryResponse.builder()
                        .id(w.getId().toString())
                        .userId(w.getUser().getId().toString())
                        .weight(w.getWeight().doubleValue())
                        .date(w.getRecordedDate().toString())
                        .build())
                .collect(Collectors.toList());

        if (weightHistory.isEmpty()) {
            userProfileRepository.findByUserId(userId)
                    .filter(p -> p.getWeight() != null)
                    .ifPresent(p -> weightHistory.add(WeightEntryResponse.builder()
                            .id("profile-current")
                            .userId(userId.toString())
                            .weight(p.getWeight().doubleValue())
                            .date(to.toString())
                            .build()));
        }

        // Calorie history – group food logs by date
        List<FoodLog> foodLogs = foodLogRepository.findByUserIdAndDateRange(userId, from, to);
        List<Map<String, Object>> calorieHistory = buildDailyDoubleHistory(from, to, foodLogs,
                l -> l.getLoggedAt().toLocalDate(), l -> l.getCalories().doubleValue(), "calories");

        // Water history
        List<WaterLog> waterLogs = waterLogRepository.findByUserIdAndDateRange(userId, from, to);
        List<Map<String, Object>> waterHistory = buildDailyIntHistory(from, to, waterLogs,
                l -> l.getLoggedAt().toLocalDate(), l -> (double) l.getAmount(), "amount");

        // Sleep history
        List<SleepLog> sleepLogs = sleepLogRepository.findByUserIdAndDateRange(userId, from, to);
        List<Map<String, Object>> sleepHistory = buildDailyDoubleHistory(from, to, sleepLogs,
                l -> l.getSleepDate(), l -> l.getDuration().doubleValue(), "duration");

        // Workout duration history
        List<WorkoutLog> workoutLogs = workoutLogRepository.findByUserIdAndDateRange(userId, from, to);
        List<Map<String, Object>> workoutHistory = buildDailyIntHistory(from, to, workoutLogs,
                l -> l.getWorkoutDate(), l -> (double) l.getDuration(), "duration");

        return ProgressDataResponse.builder()
                .weightHistory(weightHistory)
                .calorieHistory(calorieHistory)
                .waterHistory(waterHistory)
                .sleepHistory(sleepHistory)
                .workoutHistory(workoutHistory)
                .build();
    }

    @FunctionalInterface interface DateExtractor<T> { LocalDate extract(T t); }
    @FunctionalInterface interface ValueExtractor<T> { double extract(T t); }

    private <T> List<Map<String, Object>> buildDailyDoubleHistory(
            LocalDate from, LocalDate to, List<T> items,
            DateExtractor<T> dateExtractor, ValueExtractor<T> valueExtractor, String valueKey) {

        Map<LocalDate, Double> dailyMap = new LinkedHashMap<>();
        from.datesUntil(to.plusDays(1)).forEach(d -> dailyMap.put(d, 0.0));
        items.forEach(item -> dailyMap.merge(dateExtractor.extract(item), valueExtractor.extract(item), Double::sum));

        return dailyMap.entrySet().stream()
                .map(e -> { Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", e.getKey().toString());
                    m.put(valueKey, Math.round(e.getValue() * 10.0) / 10.0);
                    return m; })
                .collect(Collectors.toList());
    }

    private <T> List<Map<String, Object>> buildDailyIntHistory(
            LocalDate from, LocalDate to, List<T> items,
            DateExtractor<T> dateExtractor, ValueExtractor<T> valueExtractor, String valueKey) {
        return buildDailyDoubleHistory(from, to, items, dateExtractor, valueExtractor, valueKey);
    }
}
