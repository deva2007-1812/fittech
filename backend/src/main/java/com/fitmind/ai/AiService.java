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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

    @Value("${app.ai.gemini-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent}")
    private String geminiUrl;

    @Value("${app.ai.enabled:true}")
    private boolean aiEnabled;

    // ─── Chat ──────────────────────────────────────────────────────────────────

    public AiChatResponse chat(UUID userId, AiChatRequest request) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        List<FoodLogResponse> loggedFoods = new ArrayList<>();
        String reply = null;

        boolean loggingIntent = isFoodLoggingIntent(userMessage, request.getHistory());

        if (aiEnabled && apiKey != null && !apiKey.isBlank()) {
            String context = aiContextService.buildContext(userId);
            String systemPrompt = buildSystemPrompt(context);
            String prompt = buildChatPrompt(systemPrompt, userMessage, request.getHistory());

            try {
                String rawReply = callGemini(prompt);
                List<ParsedFoodItem> geminiItems = extractFoodLogJson(rawReply);
                reply = cleanFoodLogJsonFromReply(rawReply);

                if (!geminiItems.isEmpty()) {
                    for (ParsedFoodItem item : geminiItems) {
                        try {
                            FoodLogResponse saved = logParsedFoodItem(userId, item);
                            if (saved != null) loggedFoods.add(saved);
                        } catch (Exception e) {
                            log.warn("Failed to log parsed food item {}: {}", item.getFoodName(), e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini chat error: {}", e.getMessage());
            }
        }

        // If food was not logged via Gemini, but user explicitly asked to log food (or Gemini is offline/fallback)
        if (loggedFoods.isEmpty() && loggingIntent) {
            MealType detectedMealType = detectMealTypeFromText(userMessage, null);
            List<ParsedFoodItem> fallbackItems = extractFoodItemsHeuristically(userMessage, detectedMealType);
            for (ParsedFoodItem item : fallbackItems) {
                try {
                    FoodLogResponse saved = logParsedFoodItem(userId, item);
                    if (saved != null) loggedFoods.add(saved);
                } catch (Exception e) {
                    log.warn("Failed to log fallback food item {}: {}", item.getFoodName(), e.getMessage());
                }
            }
        }

        // If foods were logged, ensure user receives a clear confirmation
        if (!loggedFoods.isEmpty()) {
            if (reply == null || reply.isBlank() || isGenericFallback(reply)) {
                reply = buildFoodLoggedReply(loggedFoods);
            }
        } else if (reply == null || reply.isBlank()) {
            reply = getFallbackChatResponse(userMessage);
        }

        return AiChatResponse.builder()
                .reply(reply)
                .loggedFoods(loggedFoods)
                .build();
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

    public List<FoodLogResponse> processFoodFromText(UUID userId, String text, MealType defaultMealType) {
        MealType mealType = detectMealTypeFromText(text, defaultMealType);
        List<ParsedFoodItem> parsedItems = parseFoodItems(text);
        if (parsedItems.isEmpty()) {
            parsedItems = extractFoodItemsHeuristically(text, mealType);
        }
        List<FoodLogResponse> results = new ArrayList<>();

        for (ParsedFoodItem item : parsedItems) {
            try {
                if (item.getMealType() == null) {
                    item.setMealType(mealType);
                }
                FoodLogResponse logged = logParsedFoodItem(userId, item);
                if (logged != null) {
                    results.add(logged);
                }
            } catch (Exception e) {
                log.warn("Failed to log food item '{}': {}", item.getFoodName(), e.getMessage());
            }
        }
        return results;
    }

    private List<ParsedFoodItem> parseFoodItems(String text) {
        if (!aiEnabled || apiKey == null || apiKey.isBlank()) {
            return extractFoodItemsHeuristically(text, MealType.SNACK);
        }

        String prompt = """
                Extract food items from this text as a JSON array. Only output the JSON array, nothing else.
                Each item should have:
                - foodName (string)
                - quantity (number)
                - unit (string like "piece", "slice", "cup", "g", "ml", "glass", "bowl", "serving")
                - mealType (string: "BREAKFAST", "LUNCH", "DINNER", or "SNACK")
                - calories (number, estimated calories)
                - protein (number, estimated grams)
                - carbs (number, estimated grams)
                - fat (number, estimated grams)
                
                Text: """ + text + """
                
                Output format (JSON array only):
                [{"foodName":"idli","quantity":2,"unit":"piece","mealType":"BREAKFAST","calories":78,"protein":3,"carbs":16,"fat":0.4}]
                """;

        try {
            String response = callGemini(prompt);
            List<ParsedFoodItem> items = parseFoodItemsFromJson(response);
            if (!items.isEmpty()) {
                return items;
            }
        } catch (Exception e) {
            log.warn("Failed to parse food items from AI: {}", e.getMessage());
        }
        return extractFoodItemsHeuristically(text, MealType.SNACK);
    }

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-flash-lite-latest",
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash"
    );

    private String callGemini(String prompt) {
        List<String> urlsToTry = new ArrayList<>();
        if (geminiUrl != null && !geminiUrl.isBlank()) {
            urlsToTry.add(geminiUrl);
        }
        for (String model : FALLBACK_MODELS) {
            String candidateUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
            if (!urlsToTry.contains(candidateUrl)) {
                urlsToTry.add(candidateUrl);
            }
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        Exception lastException = null;
        for (String targetUrl : urlsToTry) {
            try {
                String fullUrl = targetUrl + "?key=" + apiKey;
                JsonNode response = webClient.post()
                        .uri(fullUrl)
                        .header("Content-Type", "application/json")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(JsonNode.class)
                        .block();

                if (response != null && response.has("candidates")) {
                    JsonNode candidates = response.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            for (JsonNode part : parts) {
                                if (part.has("text") && !part.path("text").asText().isBlank()) {
                                    return part.path("text").asText();
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini call to {} failed ({}), trying next model...", targetUrl, e.getMessage());
                lastException = e;
            }
        }

        throw new AiServiceException("All Gemini models failed: " + (lastException != null ? lastException.getMessage() : "No response"), lastException);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String buildSystemPrompt(String context) {
        return """
                You are FitMind AI, a friendly and knowledgeable fitness and nutrition assistant.
                You help users reach their health goals through personalized, evidence-based advice.
                Be encouraging, concise, and practical. Avoid extreme or unsafe recommendations.
                Never recommend very low calorie diets (below 1200 kcal) or excessive exercise.
                
                Current user data:
                """ + context + """
                
                FOOD LOGGING INSTRUCTIONS:
                If the user says they ate, had, or drank something, or asks you to log, record, or track a meal, snack, or food (e.g. 'I ate 2 eggs and toast', 'log 1 bowl oatmeal for breakfast', 'add 2 rotis and dal'):
                1. Identify all food items, portions, units, and the meal type (BREAKFAST, LUNCH, DINNER, or SNACK).
                2. In your friendly conversational response, clearly confirm what has been logged to their nutrition log, their estimated calories and protein, and how they contribute to their remaining daily targets.
                3. At the VERY END of your response, append a JSON code block with the exact tag ```json:food_log containing an array of parsed items:
                ```json:food_log
                [
                  {"foodName": "Boiled Eggs", "quantity": 2, "unit": "piece", "mealType": "BREAKFAST", "calories": 140, "protein": 12, "carbs": 1, "fat": 10},
                  {"foodName": "Whole Wheat Toast", "quantity": 1, "unit": "slice", "mealType": "BREAKFAST", "calories": 75, "protein": 3, "carbs": 13, "fat": 1}
                ]
                ```
                Only output the ```json:food_log block if the user is actually logging or reporting foods they consumed. Do NOT output it for general nutrition queries, recipes, or fitness questions.
                """;
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
        if (lower.contains("log my food") || lower.contains("log food") || lower.contains("log a meal") || lower.equals("log")) {
            return "I'm ready to log your food! Tell me what you ate and how much, for example:\n\n"
                    + "• *'2 boiled eggs and 1 slice of toast for breakfast'*\n"
                    + "• *'2 rotis and 1 bowl dal for lunch'*\n"
                    + "• *'1 banana and 1 scoop protein shake'*\n\n"
                    + "Just tell me and I'll calculate your calories and macros and save it directly to your Nutrition log!";
        } else if (lower.contains("calorie") || lower.contains("food") || lower.contains("eat")) {
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

    // ─── Food Logging Helpers ─────────────────────────────────────────────────

    private FoodLogResponse logParsedFoodItem(UUID userId, ParsedFoodItem item) {
        if (item.getFoodName() == null || item.getFoodName().isBlank()) return null;
        double qty = item.getQuantity() != null ? item.getQuantity() : 1.0;
        String unit = item.getUnit() != null && !item.getUnit().isBlank() ? item.getUnit() : "serving";
        String qtyString = qty + " " + unit;
        MealType mealType = item.getMealType() != null ? item.getMealType() : MealType.SNACK;

        FoodLogRequest logReq = FoodLogRequest.builder()
                .foodName(capitalizeWords(item.getFoodName().trim()))
                .quantity(qtyString)
                .mealType(mealType)
                .calories(item.getCalories())
                .protein(item.getProtein())
                .carbs(item.getCarbs())
                .fat(item.getFat())
                .build();

        return nutritionService.addFoodEntry(userId, logReq);
    }

    private boolean isFoodLoggingIntent(String text, List<Map<String, String>> history) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase().trim();

        // Check if message is a question or advice query rather than a logging statement
        if (lower.matches("^(how many|how much|what are the|can i eat|should i eat|suggest|tell me about|what is|how do i cook|recipe for|why does)\\b.*")) {
            return false;
        }

        // Direct food logging keywords
        if (lower.matches(".*\\b(log|logged|logging|record|recording|track|tracking|add to log|add to my log|add to food log|ate|had|consumed|eaten|having)\\b.*")) {
            return true;
        }

        // Meal prefixes: e.g. "breakfast: 2 eggs", "food: apple"
        if (lower.matches("^(food|breakfast|lunch|dinner|snack|meal):.*")) {
            return true;
        }

        // Check recent conversation turn in history (if coach previously asked what they ate)
        if (history != null && !history.isEmpty()) {
            Map<String, String> lastTurn = history.get(history.size() - 1);
            if (lastTurn != null && "assistant".equalsIgnoreCase(lastTurn.get("role"))) {
                String assistantMsg = lastTurn.get("content") != null ? lastTurn.get("content").toLowerCase() : "";
                if (assistantMsg.contains("what did you eat") || assistantMsg.contains("what would you like to log") || assistantMsg.contains("log my food")) {
                    return true;
                }
            }
        }

        return false;
    }

    private List<ParsedFoodItem> extractFoodLogJson(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();

        Pattern pattern = Pattern.compile("```(?:json:food_log|json)\\s*(\\[[\\s\\S]*?\\])\\s*```");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String json = matcher.group(1);
            List<ParsedFoodItem> items = parseFoodItemsFromJson(json);
            if (!items.isEmpty()) return items;
        }

        // Fallback: look for raw JSON array if markers missing
        int start = text.indexOf('[');
        int end = text.lastIndexOf(']');
        if (start >= 0 && end > start && text.substring(start, end).contains("\"foodName\"")) {
            return parseFoodItemsFromJson(text.substring(start, end + 1));
        }

        return Collections.emptyList();
    }

    private String cleanFoodLogJsonFromReply(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("```(?:json:food_log|json)\\s*\\[[\\s\\S]*?\\]\\s*```", "").trim();
        // If raw json array is left at the end
        cleaned = cleaned.replaceAll("\\[\\s*\\{[\\s\\S]*?\\}\\s*\\]", "").trim();
        return cleaned;
    }

    private List<ParsedFoodItem> parseFoodItemsFromJson(String json) {
        try {
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']');
            if (start >= 0 && end > start) {
                String sub = json.substring(start, end + 1);
                return objectMapper.readValue(sub, new TypeReference<List<ParsedFoodItem>>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to parse food items JSON: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    private MealType detectMealTypeFromText(String text, MealType defaultType) {
        String lower = text != null ? text.toLowerCase() : "";
        if (lower.contains("breakfast")) return MealType.BREAKFAST;
        if (lower.contains("lunch")) return MealType.LUNCH;
        if (lower.contains("dinner")) return MealType.DINNER;
        if (lower.contains("snack")) return MealType.SNACK;
        if (defaultType != null) return defaultType;

        int hour = LocalTime.now().getHour();
        if (hour >= 5 && hour < 11) return MealType.BREAKFAST;
        if (hour >= 11 && hour < 16) return MealType.LUNCH;
        if (hour >= 16 && hour < 19) return MealType.SNACK;
        return MealType.DINNER;
    }

    private List<ParsedFoodItem> extractFoodItemsHeuristically(String text, MealType defaultMealType) {
        List<ParsedFoodItem> items = new ArrayList<>();
        MealType mealType = detectMealTypeFromText(text, defaultMealType);

        String cleaned = text.replaceAll("(?i)^(please\\s+)?(log\\s+(my\\s+)?food(:|\\s+)?|log\\s+|add\\s+(food\\s+)?to\\s+(my\\s+)?(food\\s+)?log(:|\\s+)?|add\\s+|i\\s+(just\\s+)?(ate|had|consumed|eaten)\\s+|track\\s+(my\\s+)?(food|meal)?(:|\\s+)?)", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\s+for\\s+(breakfast|lunch|dinner|snack(s)?)$", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\s+to\\s+(my\\s+)?(food\\s+)?log$", "").trim();

        String[] parts = cleaned.split("(?i)\\s*(?:,|\\band\\b|\\&|\\+)\\s*");

        Pattern pattern = Pattern.compile("(?i)^(\\d+(?:\\.\\d+)?|a|an|one|two|three|four|five|half)?\\s*(pieces?|slices?|bowls?|cups?|glasses?|plates?|servings?|portions?|scoops?|tablespoons?|tbsp|teaspoons?|tsp|g|gm|grams?|ml|liters?|items?|rotis?|eggs?|bananas?|apples?)?\\s*(?:of\\s+)?(.+)$");

        for (String part : parts) {
            String p = part.trim();
            if (p.isBlank() || p.length() < 2) continue;

            Matcher m = pattern.matcher(p);
            if (m.matches()) {
                String qtyStr = m.group(1);
                String unitStr = m.group(2);
                String nameStr = m.group(3);

                double qty = parseQtyWord(qtyStr != null ? qtyStr.toLowerCase() : "1");
                String unit = unitStr != null && !unitStr.isBlank() ? unitStr.trim().toLowerCase() : "serving";
                String foodName = nameStr != null ? nameStr.trim() : p;
                if (foodName.length() < 2) foodName = p;

                double[] macros = estimateMacrosForFood(foodName, qty);

                items.add(ParsedFoodItem.builder()
                        .foodName(capitalizeWords(foodName))
                        .quantity(qty)
                        .unit(unit)
                        .mealType(mealType)
                        .calories(macros[0])
                        .protein(macros[1])
                        .carbs(macros[2])
                        .fat(macros[3])
                        .build());
            } else {
                double[] macros = estimateMacrosForFood(p, 1.0);
                items.add(ParsedFoodItem.builder()
                        .foodName(capitalizeWords(p))
                        .quantity(1.0)
                        .unit("serving")
                        .mealType(mealType)
                        .calories(macros[0])
                        .protein(macros[1])
                        .carbs(macros[2])
                        .fat(macros[3])
                        .build());
            }
        }

        return items;
    }

    private double[] estimateMacrosForFood(String foodName, double qty) {
        String lower = foodName.toLowerCase();
        double multiplier = qty > 0 ? qty : 1.0;

        if (lower.contains("egg")) {
            return new double[]{ 70 * multiplier, 6 * multiplier, 0.5 * multiplier, 5 * multiplier };
        } else if (lower.contains("banana")) {
            return new double[]{ 105 * multiplier, 1.3 * multiplier, 27 * multiplier, 0.3 * multiplier };
        } else if (lower.contains("apple")) {
            return new double[]{ 95 * multiplier, 0.5 * multiplier, 25 * multiplier, 0.3 * multiplier };
        } else if (lower.contains("roti") || lower.contains("chapati")) {
            return new double[]{ 100 * multiplier, 3 * multiplier, 18 * multiplier, 2 * multiplier };
        } else if (lower.contains("bread") || lower.contains("toast")) {
            return new double[]{ 75 * multiplier, 3 * multiplier, 13 * multiplier, 1 * multiplier };
        } else if (lower.contains("chicken")) {
            return new double[]{ 165 * multiplier, 31 * multiplier, 0 * multiplier, 3.6 * multiplier };
        } else if (lower.contains("milk")) {
            return new double[]{ 120 * multiplier, 8 * multiplier, 12 * multiplier, 5 * multiplier };
        } else if (lower.contains("oat") || lower.contains("oatmeal")) {
            return new double[]{ 150 * multiplier, 5 * multiplier, 27 * multiplier, 2.5 * multiplier };
        } else if (lower.contains("dal")) {
            return new double[]{ 140 * multiplier, 8 * multiplier, 18 * multiplier, 4 * multiplier };
        } else if (lower.contains("rice")) {
            return new double[]{ 130 * multiplier, 2.7 * multiplier, 28 * multiplier, 0.3 * multiplier };
        } else if (lower.contains("idli")) {
            return new double[]{ 39 * multiplier, 1.5 * multiplier, 8 * multiplier, 0.2 * multiplier };
        } else if (lower.contains("dosa")) {
            return new double[]{ 168 * multiplier, 3.7 * multiplier, 31 * multiplier, 3.7 * multiplier };
        }
        // General healthy default per serving
        return new double[]{ 120 * multiplier, 4 * multiplier, 20 * multiplier, 3 * multiplier };
    }

    private double parseQtyWord(String word) {
        if (word == null || word.isBlank()) return 1.0;
        return switch (word) {
            case "a", "an", "one" -> 1.0;
            case "two" -> 2.0;
            case "three" -> 3.0;
            case "four" -> 4.0;
            case "five" -> 5.0;
            case "half" -> 0.5;
            default -> {
                try {
                    yield Double.parseDouble(word);
                } catch (NumberFormatException e) {
                    yield 1.0;
                }
            }
        };
    }

    private String buildFoodLoggedReply(List<FoodLogResponse> loggedFoods) {
        StringBuilder sb = new StringBuilder("✅ **Logged to your Nutrition:**\n\n");
        double totalCal = 0;
        double totalProt = 0;
        for (FoodLogResponse f : loggedFoods) {
            String unitStr = f.getUnit() != null ? f.getUnit() : "";
            sb.append("• **").append(f.getFoodName()).append("** (").append(f.getQuantity()).append(" ").append(unitStr)
              .append(", ").append(f.getMealType()).append(") — **")
              .append(Math.round(f.getCalories() != null ? f.getCalories() : 0)).append(" kcal** (")
              .append(Math.round(f.getProtein() != null ? f.getProtein() : 0)).append("g protein)\n");
            totalCal += f.getCalories() != null ? f.getCalories() : 0;
            totalProt += f.getProtein() != null ? f.getProtein() : 0;
        }
        sb.append("\n**Total added:** ").append(Math.round(totalCal)).append(" kcal · ")
          .append(Math.round(totalProt)).append("g protein.\n\n")
          .append("Your daily nutrition log and macro targets are now updated! Check the Nutrition section to see your updated progress.");
        return sb.toString();
    }

    private boolean isGenericFallback(String text) {
        if (text == null) return true;
        String lower = text.toLowerCase();
        return lower.contains("i'd recommend focusing on whole foods")
                || lower.contains("i'm fitmind ai, your personal fitness");
    }

    private String capitalizeWords(String str) {
        if (str == null || str.isBlank()) return str;
        String[] words = str.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(Character.toUpperCase(w.charAt(0)))
                  .append(w.substring(1).toLowerCase())
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }
}
