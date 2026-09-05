package com.fitmind.service;

import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.exception.ResourceNotFoundException;
import com.fitmind.repository.*;
import com.fitmind.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaterService {

    private final WaterLogRepository waterLogRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @Transactional
    public WaterEntryResponse addWater(UUID userId, WaterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        LocalDate date = parseDate(request.getDate());

        WaterLog log = WaterLog.builder()
                .user(user)
                .amount(request.getAmount())
                .loggedAt(date.atStartOfDay().atOffset(ZoneOffset.UTC))
                .build();

        return toResponse(waterLogRepository.save(log));
    }

    public WaterLogResponse getTodayLog(UUID userId) {
        LocalDate today = LocalDate.now();
        List<WaterLog> logs = waterLogRepository.findByUserIdAndDate(userId, today);

        Integer total = logs.stream().mapToInt(WaterLog::getAmount).sum();
        DailyTargetsResponse targets = userService.getDailyTargets(userId);

        return WaterLogResponse.builder()
                .date(today.toString())
                .totalAmount(total)
                .dailyTarget(targets.getWater())
                .entries(logs.stream().map(this::toResponse).collect(Collectors.toList()))
                .build();
    }

    public List<Map<String, Object>> getHistory(UUID userId, int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);
        List<WaterLog> logs = waterLogRepository.findByUserIdAndDateRange(userId, from, to);

        // Group by date and sum amounts
        Map<LocalDate, Integer> dailyTotals = new LinkedHashMap<>();
        from.datesUntil(to.plusDays(1)).forEach(d -> dailyTotals.put(d, 0));
        logs.forEach(l -> {
            LocalDate d = l.getLoggedAt().toLocalDate();
            dailyTotals.merge(d, l.getAmount(), Integer::sum);
        });

        return dailyTotals.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", e.getKey().toString());
                    m.put("amount", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteWater(UUID userId, UUID logId) {
        WaterLog log = waterLogRepository.findByIdAndUserId(logId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Water log", logId.toString()));
        waterLogRepository.delete(log);
    }

    public Integer getTotalToday(UUID userId) {
        Integer total = waterLogRepository.sumAmountByUserIdAndDate(userId, LocalDate.now());
        return total != null ? total : 0;
    }

    private WaterEntryResponse toResponse(WaterLog log) {
        return WaterEntryResponse.builder()
                .id(log.getId().toString())
                .userId(log.getUser().getId().toString())
                .amount(log.getAmount())
                .date(log.getLoggedAt().toLocalDate().toString())
                .createdAt(log.getLoggedAt())
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
