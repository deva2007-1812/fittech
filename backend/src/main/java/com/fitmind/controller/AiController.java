package com.fitmind.controller;

import com.fitmind.ai.AiService;
import com.fitmind.dto.*;
import com.fitmind.entity.MealType;
import com.fitmind.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI chat, insights, and food analysis")
@SecurityRequirement(name = "Bearer Auth")
public class AiController {

    private final AiService aiService;
    private final AuthUtils authUtils;

    @PostMapping("/chat")
    @Operation(summary = "Chat with FitMind AI assistant")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        return ResponseEntity.ok(aiService.chat(authUtils.getCurrentUserId(), request));
    }

    @GetMapping("/insight")
    @Operation(summary = "Get AI-generated daily insight")
    public ResponseEntity<AiInsightResponse> getDailyInsight() {
        return ResponseEntity.ok(aiService.getDailyInsight(authUtils.getCurrentUserId()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get chat history (returns empty list - history stored client-side)")
    public ResponseEntity<List<Object>> getChatHistory() {
        // Chat history is stored client-side in this stateless implementation
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/food-analysis")
    @Operation(summary = "Parse natural language food description and log it")
    public ResponseEntity<List<FoodLogResponse>> analyzeFoodText(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        List<FoodLogResponse> logged = aiService.processFoodFromText(
                authUtils.getCurrentUserId(), text, MealType.SNACK);
        return ResponseEntity.status(HttpStatus.CREATED).body(logged);
    }

    @PostMapping("/voice")
    @Operation(summary = "Process voice transcript and log foods")
    public ResponseEntity<Map<String, Object>> processVoice(@RequestBody Map<String, String> body) {
        String transcript = body.get("transcript");
        if (transcript == null || transcript.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        List<FoodLogResponse> foodEntries = aiService.processFoodFromText(
                authUtils.getCurrentUserId(), transcript, MealType.SNACK);

        AiChatRequest chatReq = AiChatRequest.builder().message(transcript).build();
        AiChatResponse chatResp = aiService.chat(authUtils.getCurrentUserId(), chatReq);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("reply", chatResp.getReply());
        response.put("foodEntries", foodEntries);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/weekly-insights")
    @Operation(summary = "Get AI weekly summary and recommendations")
    public ResponseEntity<Map<String, String>> getWeeklyInsights() {
        String insights = aiService.getWeeklyInsights(authUtils.getCurrentUserId());
        return ResponseEntity.ok(Map.of("insights", insights));
    }
}
