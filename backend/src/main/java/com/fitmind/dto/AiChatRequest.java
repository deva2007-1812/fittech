package com.fitmind.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {
    private String message;
    private List<Map<String, String>> history; // [{role: "user", content: "..."}, ...]
}
