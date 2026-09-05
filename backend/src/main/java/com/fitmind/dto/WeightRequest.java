package com.fitmind.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightRequest {

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "10.0", message = "Weight must be at least 10 kg")
    @DecimalMax(value = "500.0", message = "Weight cannot exceed 500 kg")
    private Double weight; // kg

    private String date; // ISO date yyyy-MM-dd
}
