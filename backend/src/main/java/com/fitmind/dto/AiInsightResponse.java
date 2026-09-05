package com.fitmind.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInsightResponse {
    private String id;
    private String message;
    private String category; // nutrition, workout, sleep, water, general
    private String createdAt;
}
