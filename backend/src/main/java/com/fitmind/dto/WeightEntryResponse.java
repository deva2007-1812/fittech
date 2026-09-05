package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightEntryResponse {
    private String id;
    private String userId;
    private Double weight;
    private String date;
    private String createdAt;
}
