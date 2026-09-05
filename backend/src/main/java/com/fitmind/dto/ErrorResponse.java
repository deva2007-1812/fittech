package com.fitmind.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private String timestamp;
    private int status;
    private String message;
    private String path;
}
