package com.fitmind.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterLogResponse {
    private String date;
    private Integer totalAmount;
    private Integer dailyTarget;
    private List<WaterEntryResponse> entries;
}
