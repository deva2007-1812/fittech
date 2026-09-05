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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeightService {

    private final WeightHistoryRepository weightHistoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public WeightEntryResponse logWeight(UUID userId, WeightRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        LocalDate date = parseDate(request.getDate());

        WeightHistory entry = WeightHistory.builder()
                .user(user)
                .weight(BigDecimal.valueOf(request.getWeight()))
                .recordedDate(date)
                .build();

        return toResponse(weightHistoryRepository.save(entry));
    }

    public List<WeightEntryResponse> getHistory(UUID userId, String range) {
        LocalDate to = LocalDate.now();
        LocalDate from = switch (range) {
            case "30d" -> to.minusDays(30);
            case "90d" -> to.minusDays(90);
            default    -> to.minusDays(7);
        };
        return weightHistoryRepository.findByUserIdAndDateRange(userId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public Double getLatestWeight(UUID userId) {
        return weightHistoryRepository.findFirstByUserIdOrderByRecordedDateDesc(userId)
                .map(w -> w.getWeight().doubleValue())
                .orElse(null);
    }

    public ProgressDataResponse getProgressData(UUID userId, String range) {
        LocalDate to = LocalDate.now();
        int days = switch (range) {
            case "30d" -> 30;
            case "90d" -> 90;
            default    -> 7;
        };
        LocalDate from = to.minusDays(days - 1);

        List<WeightEntryResponse> weightHistory =
                weightHistoryRepository.findByUserIdAndDateRange(userId, from, to)
                        .stream().map(this::toResponse).collect(Collectors.toList());

        // Calorie, water, sleep, workout history will be assembled by DashboardService / ProgressService
        return ProgressDataResponse.builder()
                .weightHistory(weightHistory)
                .calorieHistory(Collections.emptyList())
                .waterHistory(Collections.emptyList())
                .sleepHistory(Collections.emptyList())
                .workoutHistory(Collections.emptyList())
                .build();
    }

    private WeightEntryResponse toResponse(WeightHistory w) {
        return WeightEntryResponse.builder()
                .id(w.getId().toString())
                .userId(w.getUser().getId().toString())
                .weight(w.getWeight().doubleValue())
                .date(w.getRecordedDate().toString())
                .createdAt(w.getRecordedDate().toString())
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
