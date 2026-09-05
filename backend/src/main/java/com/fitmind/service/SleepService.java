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
public class SleepService {

    private final SleepLogRepository sleepLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public SleepEntryResponse logSleep(UUID userId, SleepRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        LocalDate date = parseDate(request.getDate());

        SleepLog log = SleepLog.builder()
                .user(user)
                .duration(request.getDuration() != null
                        ? BigDecimal.valueOf(request.getDuration()) : BigDecimal.ZERO)
                .bedtime(request.getBedtime())
                .wakeTime(request.getWakeTime())
                .sleepDate(date)
                .build();

        return toResponse(sleepLogRepository.save(log));
    }

    public SleepEntryResponse getTodaySleep(UUID userId) {
        return sleepLogRepository
                .findFirstByUserIdAndSleepDateOrderByCreatedAtDesc(userId, LocalDate.now())
                .map(this::toResponse)
                .orElse(null);
    }

    public List<SleepEntryResponse> getHistory(UUID userId, int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);
        return sleepLogRepository.findByUserIdAndDateRange(userId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteSleep(UUID userId, UUID sleepId) {
        SleepLog log = sleepLogRepository.findByIdAndUserId(sleepId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Sleep log", sleepId.toString()));
        sleepLogRepository.delete(log);
    }

    public Double getDurationToday(UUID userId) {
        return sleepLogRepository
                .findFirstByUserIdAndSleepDateOrderByCreatedAtDesc(userId, LocalDate.now())
                .map(l -> l.getDuration().doubleValue())
                .orElse(0.0);
    }

    private SleepEntryResponse toResponse(SleepLog log) {
        return SleepEntryResponse.builder()
                .id(log.getId().toString())
                .userId(log.getUser().getId().toString())
                .duration(log.getDuration().doubleValue())
                .bedtime(log.getBedtime())
                .wakeTime(log.getWakeTime())
                .date(log.getSleepDate().toString())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
