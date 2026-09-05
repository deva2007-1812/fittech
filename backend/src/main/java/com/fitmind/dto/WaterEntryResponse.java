package com.fitmind.dto;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterEntryResponse {
    private String id;
    private String userId;
    private Integer amount;
    private String date;
    private OffsetDateTime createdAt;
}
