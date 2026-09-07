package com.fitmind.service;

import com.fitmind.dto.*;
import com.fitmind.dto.admin.*;
import com.fitmind.entity.*;
import com.fitmind.exception.ResourceNotFoundException;
import com.fitmind.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final FoodRepository foodRepository;
    private final FoodLogRepository foodLogRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final WaterLogRepository waterLogRepository;
    private final SleepLogRepository sleepLogRepository;

    public AdminStatsResponse getSystemStats() {
        long totalUsers = userRepository.count();
        long totalFoodLogs = foodLogRepository.count();
        long totalWorkoutLogs = workoutLogRepository.count();
        long totalWaterLogs = waterLogRepository.count();
        long totalSleepLogs = sleepLogRepository.count();
        long totalFoods = foodRepository.count();

        List<User> users = userRepository.findAll();
        long adminCount = users.stream().filter(u -> "ADMIN".equalsIgnoreCase(u.getRole())).count();
        long standardCount = totalUsers - adminCount;

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .adminUsers(adminCount)
                .standardUsers(standardCount)
                .totalFoodLogs(totalFoodLogs)
                .totalWorkoutLogs(totalWorkoutLogs)
                .totalWaterLogs(totalWaterLogs)
                .totalSleepLogs(totalSleepLogs)
                .totalFoodsInDatabase(totalFoods)
                .build();
    }

    public List<AdminUserResponse> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<UserProfile> profiles = userProfileRepository.findAll();
        Map<UUID, UserProfile> profileMap = profiles.stream()
                .filter(p -> p.getUser() != null)
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        return users.stream().map(user -> {
            UserProfile profile = profileMap.get(user.getId());
            boolean complete = profile != null && profile.getAge() != null;

            return AdminUserResponse.builder()
                    .id(user.getId().toString())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole() != null ? user.getRole() : "USER")
                    .age(profile != null ? profile.getAge() : null)
                    .height(profile != null && profile.getHeight() != null ? profile.getHeight().doubleValue() : null)
                    .weight(profile != null && profile.getWeight() != null ? profile.getWeight().doubleValue() : null)
                    .activityLevel(profile != null ? profile.getActivityLevel() : null)
                    .fitnessGoal(profile != null ? profile.getFitnessGoal() : null)
                    .dailyCalorieTarget(profile != null ? profile.getDailyCalorieTarget() : null)
                    .dailyWaterTarget(profile != null ? profile.getDailyWaterTarget() : null)
                    .profileComplete(complete)
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminUserResponse updateUserRole(UUID userId, UpdateRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String newRole = request.getRole().toUpperCase();
        user.setRole(newRole);
        userRepository.save(user);
        log.info("Updated role for user {} to {}", user.getEmail(), newRole);

        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        boolean complete = profile != null && profile.getAge() != null;

        return AdminUserResponse.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .age(profile != null ? profile.getAge() : null)
                .height(profile != null && profile.getHeight() != null ? profile.getHeight().doubleValue() : null)
                .weight(profile != null && profile.getWeight() != null ? profile.getWeight().doubleValue() : null)
                .activityLevel(profile != null ? profile.getActivityLevel() : null)
                .fitnessGoal(profile != null ? profile.getFitnessGoal() : null)
                .dailyCalorieTarget(profile != null ? profile.getDailyCalorieTarget() : null)
                .dailyWaterTarget(profile != null ? profile.getDailyWaterTarget() : null)
                .profileComplete(complete)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
        log.info("Admin deleted user with id: {}", userId);
    }

    public AdminUserActivityResponse getUserActivity(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE;

        List<FoodLog> foodLogs = foodLogRepository.findAll().stream()
                .filter(fl -> fl.getUser().getId().equals(userId))
                .sorted((a, b) -> b.getLoggedAt().compareTo(a.getLoggedAt()))
                .limit(20)
                .toList();

        List<WorkoutLog> workoutLogs = workoutLogRepository.findAll().stream()
                .filter(w -> w.getUser().getId().equals(userId))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(20)
                .toList();

        List<WaterLog> waterLogs = waterLogRepository.findAll().stream()
                .filter(w -> w.getUser().getId().equals(userId))
                .sorted((a, b) -> b.getLoggedAt().compareTo(a.getLoggedAt()))
                .limit(20)
                .toList();

        List<SleepLog> sleepLogs = sleepLogRepository.findAll().stream()
                .filter(s -> s.getUser().getId().equals(userId))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(20)
                .toList();

        List<FoodLogResponse> foodResponses = foodLogs.stream().map(fl -> FoodLogResponse.builder()
                .id(fl.getId().toString())
                .userId(fl.getUser().getId().toString())
                .foodName(fl.getFoodName())
                .quantity(fl.getQuantity().toPlainString())
                .unit(fl.getUnit())
                .mealType(fl.getMealType())
                .calories(fl.getCalories().doubleValue())
                .protein(fl.getProtein().doubleValue())
                .carbs(fl.getCarbohydrates().doubleValue())
                .fat(fl.getFat().doubleValue())
                .date(fl.getLoggedAt().toLocalDate().format(dtf))
                .createdAt(fl.getLoggedAt())
                .build()).toList();

        List<WorkoutResponse> workoutResponses = workoutLogs.stream().map(w -> WorkoutResponse.builder()
                .id(w.getId().toString())
                .userId(w.getUser().getId().toString())
                .exercise(w.getExercise())
                .duration(w.getDuration())
                .sets(w.getSets())
                .reps(w.getRepetitions())
                .notes(w.getNotes())
                .caloriesBurned(w.getCaloriesBurned() != null ? w.getCaloriesBurned().doubleValue() : null)
                .date(w.getWorkoutDate().format(dtf))
                .createdAt(w.getCreatedAt())
                .build()).toList();

        List<WaterEntryResponse> waterResponses = waterLogs.stream().map(w -> WaterEntryResponse.builder()
                .id(w.getId().toString())
                .userId(w.getUser().getId().toString())
                .amount(w.getAmount())
                .date(w.getLoggedAt().toLocalDate().format(dtf))
                .createdAt(w.getLoggedAt())
                .build()).toList();

        List<SleepEntryResponse> sleepResponses = sleepLogs.stream().map(s -> SleepEntryResponse.builder()
                .id(s.getId().toString())
                .userId(s.getUser().getId().toString())
                .duration(s.getDuration().doubleValue())
                .bedtime(s.getBedtime())
                .wakeTime(s.getWakeTime())
                .date(s.getSleepDate().format(dtf))
                .createdAt(s.getCreatedAt())
                .build()).toList();

        return AdminUserActivityResponse.builder()
                .userId(user.getId().toString())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .recentFoodLogs(foodResponses)
                .recentWorkoutLogs(workoutResponses)
                .recentWaterLogs(waterResponses)
                .recentSleepLogs(sleepResponses)
                .build();
    }

    @Transactional
    public FoodResponse addFood(FoodAdminRequest request) {
        Food food = Food.builder()
                .name(request.getName().trim())
                .servingSize(BigDecimal.valueOf(request.getServingSize()))
                .servingUnit(request.getServingUnit().trim())
                .calories(BigDecimal.valueOf(request.getCalories()))
                .protein(BigDecimal.valueOf(request.getProtein()))
                .carbohydrates(BigDecimal.valueOf(request.getCarbohydrates()))
                .fat(BigDecimal.valueOf(request.getFat()))
                .fiber(request.getFiber() != null ? BigDecimal.valueOf(request.getFiber()) : BigDecimal.ZERO)
                .build();

        food = foodRepository.save(food);
        log.info("Admin created new food: {}", food.getName());
        return toFoodResponse(food);
    }

    @Transactional
    public FoodResponse updateFood(UUID foodId, FoodAdminRequest request) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found with id: " + foodId));

        food.setName(request.getName().trim());
        food.setServingSize(BigDecimal.valueOf(request.getServingSize()));
        food.setServingUnit(request.getServingUnit().trim());
        food.setCalories(BigDecimal.valueOf(request.getCalories()));
        food.setProtein(BigDecimal.valueOf(request.getProtein()));
        food.setCarbohydrates(BigDecimal.valueOf(request.getCarbohydrates()));
        food.setFat(BigDecimal.valueOf(request.getFat()));
        if (request.getFiber() != null) {
            food.setFiber(BigDecimal.valueOf(request.getFiber()));
        }

        food = foodRepository.save(food);
        log.info("Admin updated food with id: {}", foodId);
        return toFoodResponse(food);
    }

    @Transactional
    public void deleteFood(UUID foodId) {
        if (!foodRepository.existsById(foodId)) {
            throw new ResourceNotFoundException("Food not found with id: " + foodId);
        }
        foodRepository.deleteById(foodId);
        log.info("Admin deleted food with id: {}", foodId);
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
}
