package com.fitmind.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterRequest {

    @Min(value = 1, message = "Amount must be at least 1 ml")
    @Max(value = 5000, message = "Amount cannot exceed 5000 ml per entry")
    private Integer amount; // ml

    private String date; // ISO date yyyy-MM-dd
}
