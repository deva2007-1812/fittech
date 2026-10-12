package com.fitmind.service;

import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.exception.ResourceNotFoundException;
import com.fitmind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutLogRepository workoutLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public WorkoutResponse addWorkout(UUID userId, WorkoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        LocalDate date = parseDate(request.getDate());

        int duration = 0;
        if (request.getDuration() != null && request.getDuration() > 0) {
            duration = request.getDuration();
        } else if (request.getSets() != null && request.getSets() > 0) {
            duration = Math.max(10, request.getSets() * 4);
        } else {
            duration = 15;
        }

        BigDecimal caloriesBurned = null;
        if (request.getCaloriesBurned() != null && request.getCaloriesBurned() > 0) {
            caloriesBurned = BigDecimal.valueOf(request.getCaloriesBurned());
        } else if (duration > 0) {
            caloriesBurned = BigDecimal.valueOf(estimateCaloriesBurned(request.getExercise(), duration));
        }

        WorkoutLog log = WorkoutLog.builder()
                .user(user)
                .exercise(request.getExercise())
                .duration(duration)
                .sets(request.getSets())
                .repetitions(request.getReps())
                .notes(request.getNotes())
                .caloriesBurned(caloriesBurned)
                .workoutDate(date)
                .build();

        return toResponse(workoutLogRepository.save(log));
    }

    public double estimateCaloriesBurned(String exercise, int durationMinutes) {
        if (exercise == null || durationMinutes <= 0) return 0.0;
        String lower = exercise.toLowerCase();
        double burnPerMinute;
        if (lower.contains("run") || lower.contains("jog")) {
            burnPerMinute = 10.5;
        } else if (lower.contains("cycl") || lower.contains("bike")) {
            burnPerMinute = 8.5;
        } else if (lower.contains("swim")) {
            burnPerMinute = 9.5;
        } else if (lower.contains("hiit") || lower.contains("circuit")) {
            burnPerMinute = 11.0;
        } else if (lower.contains("walk")) {
            burnPerMinute = 4.5;
        } else if (lower.contains("yoga") || lower.contains("stretch") || lower.contains("pilates")) {
            burnPerMinute = 4.0;
        } else if (lower.contains("jump") || lower.contains("rope")) {
            burnPerMinute = 12.0;
        } else if (lower.contains("press") || lower.contains("squat") || lower.contains("deadlift") || lower.contains("curl") || lower.contains("weight") || lower.contains("gym") || lower.contains("bench") || lower.contains("push-up") || lower.contains("pull-up")) {
            burnPerMinute = 6.5;
        } else {
            burnPerMinute = 6.0;
        }
        return Math.round(burnPerMinute * durationMinutes * 10.0) / 10.0;
    }

    public List<WorkoutResponse> getTodayWorkouts(UUID userId) {
        return workoutLogRepository
                .findByUserIdAndWorkoutDateOrderByCreatedAtDesc(userId, LocalDate.now())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkoutResponse> getWorkoutsByDate(UUID userId, LocalDate date) {
        return workoutLogRepository
                .findByUserIdAndWorkoutDateOrderByCreatedAtDesc(userId, date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkoutResponse> getHistory(UUID userId, int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);
        return workoutLogRepository.findByUserIdAndDateRange(userId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteWorkout(UUID userId, UUID workoutId) {
        WorkoutLog log = workoutLogRepository.findByIdAndUserId(workoutId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workout", workoutId.toString()));
        workoutLogRepository.delete(log);
    }

    public Integer getTotalDurationToday(UUID userId) {
        Integer total = workoutLogRepository.sumDurationByUserIdAndDate(userId, LocalDate.now());
        return total != null ? total : 0;
    }

    private WorkoutResponse toResponse(WorkoutLog log) {
        return WorkoutResponse.builder()
                .id(log.getId().toString())
                .userId(log.getUser().getId().toString())
                .exercise(log.getExercise())
                .duration(log.getDuration())
                .sets(log.getSets())
                .reps(log.getRepetitions())
                .notes(log.getNotes())
                .caloriesBurned(log.getCaloriesBurned() != null ? log.getCaloriesBurned().doubleValue() : null)
                .date(log.getWorkoutDate().toString())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
