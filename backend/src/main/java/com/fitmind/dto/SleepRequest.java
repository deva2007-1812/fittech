package com.fitmind.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepRequest {

    @DecimalMin(value = "0.5", message = "Sleep duration must be at least 0.5 hours")
    @DecimalMax(value = "24.0", message = "Sleep duration cannot exceed 24 hours")
    private Double duration; // hours

    private String bedtime;  // HH:MM
    private String wakeTime; // HH:MM
    private String date;     // ISO date yyyy-MM-dd
}
