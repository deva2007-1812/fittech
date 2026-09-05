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

        WorkoutLog log = WorkoutLog.builder()
                .user(user)
                .exercise(request.getExercise())
                .duration(request.getDuration() != null ? request.getDuration() : 0)
                .sets(request.getSets())
                .repetitions(request.getReps())
                .notes(request.getNotes())
                .workoutDate(date)
                .build();

        return toResponse(workoutLogRepository.save(log));
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
