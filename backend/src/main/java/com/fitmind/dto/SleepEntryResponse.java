package com.fitmind.dto;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepEntryResponse {
    private String id;
    private String userId;
    private Double duration;
    private String bedtime;
    private String wakeTime;
    private String date;
    private OffsetDateTime createdAt;
}
