package com.fitmind.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.exception.AiServiceException;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Service using Google Gemini API.
 * The AI is responsible for LANGUAGE UNDERSTANDING only.
 * All numerical nutrition calculations are done by the backend.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final WebClient webClient;
    private final AiContextService aiContextService;
    private final NutritionService nutritionService;
    private final FoodRepository foodRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.gemini-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiUrl;

    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    // ─── Chat ──────────────────────────────────────────────────────────────────

    public AiChatResponse chat(UUID userId, AiChatRequest request) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return AiChatResponse.builder()
                    .reply(getFallbackChatResponse(request.getMessage()))
                    .build();
        }

        String context = aiContextService.buildContext(userId);
        String systemPrompt = buildSystemPrompt(context);
        String prompt = buildChatPrompt(systemPrompt, request.getMessage(), request.getHistory());

        try {
            String reply = callGemini(prompt);
            return AiChatResponse.builder().reply(reply).build();
        } catch (Exception e) {
            log.warn("Gemini chat error: {}", e.getMessage());
            return AiChatResponse.builder()
                    .reply(getFallbackChatResponse(request.getMessage()))
                    .build();
        }
    }

    // ─── Daily Insight ─────────────────────────────────────────────────────────

    public AiInsightResponse getDailyInsight(UUID userId) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return buildFallbackInsight();
        }

        String context = aiContextService.buildContext(userId);
        String prompt = """
                You are FitMind AI, a health and fitness assistant.
                Based on the user's data below, give ONE concise, encouraging, actionable insight (2-3 sentences max).
                Focus on what they did well or one specific improvement tip.
                Do not be generic. Be specific to their data.
                Do not recommend extreme diets or excessive exercise.
                
                USER DATA:
                """ + context;

        try {
            String insight = callGemini(prompt);
            String category = detectCategory(insight);
            return AiInsightResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .message(insight)
                    .category(category)
                    .createdAt(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                    .build();
        } catch (Exception e) {
            log.warn("Gemini insight error: {}", e.getMessage());
            return buildFallbackInsight();
        }
    }

    // ─── Weekly Insights ───────────────────────────────────────────────────────

    public String getWeeklyInsights(UUID userId) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return "Great job staying consistent this week! Keep tracking your meals and workouts for better insights.";
        }

        String context = aiContextService.buildWeeklyContext(userId);
        String prompt = """
                You are FitMind AI. Based on the user's weekly data below, generate a friendly, structured weekly summary.
                Include:
                1. Nutrition trends
                2. Activity level
                3. Hydration
                4. Sleep quality
                5. Key recommendation (safe and practical)
                Keep it under 200 words. Be encouraging.
                
                """ + context;

        try {
            return callGemini(prompt);
        } catch (Exception e) {
            log.warn("Gemini weekly insights error: {}", e.getMessage());
            return "Unable to generate weekly insights at this time. Keep up the great work!";
        }
    }

    // ─── Voice / Food Analysis ─────────────────────────────────────────────────

    public List<FoodLogResponse> processFoodFromText(UUID userId, String text, MealType mealType) {
        List<ParsedFoodItem> parsedItems = parseFoodItems(text);
        List<FoodLogResponse> results = new ArrayList<>();

        for (ParsedFoodItem item : parsedItems) {
            try {
                List<Food> matches = foodRepository.searchByNameNative(item.getFoodName(), 1);
                if (!matches.isEmpty()) {
                    Food food = matches.get(0);
                    double qty = item.getQuantity() != null ? item.getQuantity() : 1.0;
                    double ratio = qty / food.getServingSize().doubleValue();

                    FoodLogResponse logged = nutritionService.addFoodEntryWithNutrition(
                            userId,
                            food.getName(),
                            qty,
                            food.getServingUnit(),
                            mealType != null ? mealType : MealType.SNACK,
                            food.getCalories().doubleValue() * ratio,
                            food.getProtein().doubleValue() * ratio,
                            food.getCarbohydrates().doubleValue() * ratio,
                            food.getFat().doubleValue() * ratio,
                            food,
                            LocalDate.now()
                    );
                    results.add(logged);
                } else {
                    // Food not found in DB – log with zero nutrition; user can edit
                    FoodLogRequest manual = FoodLogRequest.builder()
                            .foodName(item.getFoodName())
                            .quantity(String.valueOf(item.getQuantity() != null ? item.getQuantity() : 1.0))
                            .mealType(mealType)
                            .build();
                    results.add(nutritionService.addFoodEntry(userId, manual));
                }
            } catch (Exception e) {
                log.warn("Failed to log food item '{}': {}", item.getFoodName(), e.getMessage());
            }
        }
        return results;
    }

    private List<ParsedFoodItem> parseFoodItems(String text) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return parseSimpleFallback(text);
        }

        String prompt = """
                Extract food items from this text as a JSON array. Only output the JSON array, nothing else.
                Each item should have: foodName (string), quantity (number), unit (string like "piece", "cup", "g", "ml", "glass", "bowl").
                If quantity is unclear, use 1. If unit is unclear, use "serving".
                
                Text: """ + text + """
                
                Output format (JSON array only):
                [{"foodName":"idli","quantity":2,"unit":"piece"},{"foodName":"milk","quantity":1,"unit":"glass"}]
                """;

        try {
            String response = callGemini(prompt);
            // Extract JSON array from response
            int start = response.indexOf('[');
            int end = response.lastIndexOf(']');
            if (start >= 0 && end > start) {
                String json = response.substring(start, end + 1);
                return objectMapper.readValue(json, new TypeReference<List<ParsedFoodItem>>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to parse food items from AI: {}", e.getMessage());
        }
        return parseSimpleFallback(text);
    }

    private List<ParsedFoodItem> parseSimpleFallback(String text) {
        // Very basic fallback: treat entire text as one food item
        return List.of(ParsedFoodItem.builder()
                .foodName(text.trim())
                .quantity(1.0)
                .unit("serving")
                .build());
    }

    // ─── Gemini API Call ───────────────────────────────────────────────────────

    private String callGemini(String prompt) {
        String url = geminiUrl + "?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        try {
            JsonNode response = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) throw new AiServiceException("Empty response from Gemini");

            return response.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("I'm having trouble responding right now.");
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("Gemini API error: " + e.getMessage(), e);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String buildSystemPrompt(String context) {
        return """
                You are FitMind AI, a friendly and knowledgeable fitness and nutrition assistant.
                You help users reach their health goals through personalized, evidence-based advice.
                Be encouraging, concise, and practical. Avoid extreme or unsafe recommendations.
                Never recommend very low calorie diets (below 1200 kcal) or excessive exercise.
                
                Current user data:
                """ + context;
    }

    private String buildChatPrompt(String system, String message, List<Map<String, String>> history) {
        StringBuilder sb = new StringBuilder(system).append("\n\nCONVERSATION:\n");
        if (history != null) {
            history.forEach(h -> sb.append(h.get("role").toUpperCase())
                    .append(": ").append(h.get("content")).append("\n"));
        }
        sb.append("USER: ").append(message).append("\nASSISTANT:");
        return sb.toString();
    }

    private String getFallbackChatResponse(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("calorie") || lower.contains("food") || lower.contains("eat")) {
            return "I'd recommend focusing on whole foods and balanced macros. Make sure to log your meals to track your nutrition accurately!";
        } else if (lower.contains("workout") || lower.contains("exercise") || lower.contains("gym")) {
            return "Consistency is key! Aim for at least 150 minutes of moderate activity per week. Track your workouts to see progress over time.";
        } else if (lower.contains("water") || lower.contains("hydrat")) {
            return "Staying hydrated is essential! Aim for at least 8 glasses (2000ml) of water per day. Your body will thank you!";
        } else if (lower.contains("sleep")) {
            return "Quality sleep (7-9 hours) is crucial for recovery and fitness progress. Try to maintain a consistent sleep schedule.";
        }
        return "I'm FitMind AI, your personal fitness and nutrition assistant! Log your meals, workouts, water, and sleep to get personalized insights. What would you like to track today?";
    }

    private AiInsightResponse buildFallbackInsight() {
        return AiInsightResponse.builder()
                .id(UUID.randomUUID().toString())
                .message("Keep logging your meals and workouts consistently to get personalized insights. Every small step counts toward your fitness goals!")
                .category("general")
                .createdAt(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .build();
    }

    private String detectCategory(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("calorie") || lower.contains("protein") || lower.contains("nutrition") || lower.contains("food")) return "nutrition";
        if (lower.contains("workout") || lower.contains("exercise") || lower.contains("training")) return "workout";
        if (lower.contains("sleep")) return "sleep";
        if (lower.contains("water") || lower.contains("hydrat")) return "water";
        return "general";
    }
}
