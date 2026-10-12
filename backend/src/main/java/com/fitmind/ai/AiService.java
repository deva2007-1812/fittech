package com.fitmind.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitmind.dto.*;
import com.fitmind.entity.*;
import com.fitmind.exception.AiServiceException;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.repository.FoodRepository;
import com.fitmind.service.WorkoutService;
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
    private final WorkoutService workoutService;
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
        List<WorkoutResponse> loggedWorkouts = new ArrayList<>();
        String reply = null;

        boolean foodLoggingIntent = isFoodLoggingIntent(userMessage, request.getHistory());
        boolean workoutLoggingIntent = isWorkoutLoggingIntent(userMessage, request.getHistory());

        if (aiEnabled && apiKey != null && !apiKey.isBlank()) {
            String context = aiContextService.buildContext(userId);
            String systemPrompt = buildSystemPrompt(context);
            String prompt = buildChatPrompt(systemPrompt, userMessage, request.getHistory());

            try {
                String rawReply = callGemini(prompt);
                List<ParsedFoodItem> geminiFoodItems = extractFoodLogJson(rawReply);
                List<ParsedWorkoutItem> geminiWorkoutItems = extractWorkoutLogJson(rawReply);
                reply = cleanJsonFromReply(rawReply);

                if (!geminiFoodItems.isEmpty()) {
                    for (ParsedFoodItem item : geminiFoodItems) {
                        try {
                            FoodLogResponse saved = logParsedFoodItem(userId, item);
                            if (saved != null) loggedFoods.add(saved);
                        } catch (Exception e) {
                            log.warn("Failed to log parsed food item {}: {}", item.getFoodName(), e.getMessage());
                        }
                    }
                }

                if (!geminiWorkoutItems.isEmpty()) {
                    for (ParsedWorkoutItem item : geminiWorkoutItems) {
                        try {
                            WorkoutResponse saved = logParsedWorkoutItem(userId, item);
                            if (saved != null) loggedWorkouts.add(saved);
                        } catch (Exception e) {
                            log.warn("Failed to log parsed workout item {}: {}", item.getExercise(), e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini chat error: {}", e.getMessage());
            }
        }

        // Fallback food logging if intent detected but not captured by Gemini
        if (loggedFoods.isEmpty() && foodLoggingIntent) {
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

        // Fallback workout logging if intent detected but not captured by Gemini
        if (loggedWorkouts.isEmpty() && workoutLoggingIntent) {
            List<ParsedWorkoutItem> fallbackWorkouts = extractWorkoutItemsHeuristically(userMessage);
            for (ParsedWorkoutItem item : fallbackWorkouts) {
                try {
                    WorkoutResponse saved = logParsedWorkoutItem(userId, item);
                    if (saved != null) loggedWorkouts.add(saved);
                } catch (Exception e) {
                    log.warn("Failed to log fallback workout item {}: {}", item.getExercise(), e.getMessage());
                }
            }
        }

        // Format confirmation replies if needed
        if (!loggedFoods.isEmpty() && !loggedWorkouts.isEmpty()) {
            if (reply == null || reply.isBlank() || isGenericFallback(reply)) {
                reply = buildCombinedLoggedReply(loggedFoods, loggedWorkouts);
            }
        } else if (!loggedFoods.isEmpty()) {
            if (reply == null || reply.isBlank() || isGenericFallback(reply)) {
                reply = buildFoodLoggedReply(loggedFoods);
            }
        } else if (!loggedWorkouts.isEmpty()) {
            if (reply == null || reply.isBlank() || isGenericFallback(reply)) {
                reply = buildWorkoutLoggedReply(loggedWorkouts);
            }
        } else if (reply == null || reply.isBlank()) {
            reply = getFallbackChatResponse(userMessage);
        }

        return AiChatResponse.builder()
                .reply(reply)
                .loggedFoods(loggedFoods)
                .loggedWorkouts(loggedWorkouts)
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

                WORKOUT LOGGING INSTRUCTIONS:
                If the user says they worked out, exercised, trained, ran, cycled, lifted weights, or asks you to log, record, or track a workout, exercise, or physical activity (e.g. 'I just ran for 30 minutes', 'log workout: 3 sets of bench press 10 reps', 'I did 45 mins of cycling and burned 350 kcal', 'log 20 min HIIT workout'):
                1. Identify each exercise name, duration in minutes, sets, reps, and estimated calories burned.
                2. In your friendly conversational response, clearly confirm what has been logged to their workout tracker, the active minutes, and estimated calories burned, encouraging their consistency.
                3. At the VERY END of your response, append a JSON code block with the exact tag ```json:workout_log containing an array of parsed items:
                ```json:workout_log
                [
                  {"exercise": "Running", "duration": 30, "sets": null, "reps": null, "caloriesBurned": 280, "notes": "Outdoor run"}
                ]
                ```
                Only output the ```json:workout_log block if the user is actually logging or reporting completed exercises or workouts. Do NOT output it for workout routine planning, fitness tips, or questions about how to perform exercises.
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
        } else if (lower.contains("log my workout") || lower.contains("log workout") || lower.contains("log exercise")) {
            return "I'm ready to log your workout! Tell me what you did, for example:\n\n"
                    + "• *'30 minutes of running outdoor'*\n"
                    + "• *'3 sets of 10 bench press and 3 sets of 12 squats'*\n"
                    + "• *'45 mins cycling, burned 320 kcal'*\n\n"
                    + "Just tell me and I'll calculate your active minutes and calories burned and save it directly to your Workout tracker!";
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

    private String cleanJsonFromReply(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("```(?:json:food_log|json:workout_log|json)\\s*\\[[\\s\\S]*?\\]\\s*```", "").trim();
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

    private List<ParsedWorkoutItem> extractWorkoutLogJson(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();

        Pattern pattern = Pattern.compile("```(?:json:workout_log|json)\\s*(\\[[\\s\\S]*?\\])\\s*```");
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            String json = matcher.group(1);
            if (json.contains("\"exercise\"")) {
                List<ParsedWorkoutItem> items = parseWorkoutItemsFromJson(json);
                if (!items.isEmpty()) return items;
            }
        }

        // Fallback: look for raw JSON array if markers missing
        int start = text.indexOf('[');
        int end = text.lastIndexOf(']');
        if (start >= 0 && end > start && text.substring(start, end).contains("\"exercise\"")) {
            return parseWorkoutItemsFromJson(text.substring(start, end + 1));
        }

        return Collections.emptyList();
    }

    private List<ParsedWorkoutItem> parseWorkoutItemsFromJson(String json) {
        try {
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']');
            if (start >= 0 && end > start) {
                String sub = json.substring(start, end + 1);
                return objectMapper.readValue(sub, new TypeReference<List<ParsedWorkoutItem>>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to parse workout items JSON: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    private WorkoutResponse logParsedWorkoutItem(UUID userId, ParsedWorkoutItem item) {
        if (item.getExercise() == null || item.getExercise().isBlank()) return null;

        String exercise = capitalizeWords(item.getExercise().trim());
        int duration = item.getDuration() != null && item.getDuration() > 0 ? item.getDuration() : 15;
        Double caloriesBurned = item.getCaloriesBurned();

        WorkoutRequest req = WorkoutRequest.builder()
                .exercise(exercise)
                .duration(duration)
                .sets(item.getSets())
                .reps(item.getReps())
                .caloriesBurned(caloriesBurned)
                .notes(item.getNotes())
                .date(LocalDate.now().toString())
                .build();

        return workoutService.addWorkout(userId, req);
    }

    public boolean isWorkoutLoggingIntent(String text, List<Map<String, String>> history) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase().trim();

        // Avoid pure queries / question sentences
        if (lower.matches("^(how to|how do i|how many sets|what is the best|suggest a workout|can i do|should i do|tell me about|how to perform|why do)\\b.*")) {
            return false;
        }

        // Explicit workout logging commands
        if (lower.matches(".*\\b(log (my )?(workout|exercise|training|run|running|cardio|session)|add to (my )?(workout|exercise) log|track (my )?(workout|exercise))\\b.*")) {
            return true;
        }

        // Activity completion statements
        if (lower.matches(".*\\b(i (just )?(worked out|exercised|trained|ran|jogged|cycled|swam|walked|lifted weights?|did|completed))\\b.*")
                && (lower.matches(".*\\b(min|mins|minutes?|km|miles?|sets?|reps?|repetition|push-?ups?|squats?|pull-?ups?|bench|hiit|yoga|cardio|gym|workout)\\b.*"))) {
            return true;
        }

        // Prefix syntax: "workout: 3 sets bench press", "exercise: running 30 mins"
        if (lower.matches("^(workout|exercise|activity):.*")) {
            return true;
        }

        // Sets / reps direct notation, e.g. "3 sets of 10 pushups", "4 sets squats 12 reps"
        if (lower.matches(".*\\b\\d+\\s*(sets?|x)\\s*(of\\s*)?\\d*\\s*(reps?)?\\s*[a-zA-Z].*")) {
            return true;
        }

        // Check history
        if (history != null && !history.isEmpty()) {
            Map<String, String> lastTurn = history.get(history.size() - 1);
            if (lastTurn != null && "assistant".equalsIgnoreCase(lastTurn.get("role"))) {
                String assistantMsg = lastTurn.get("content") != null ? lastTurn.get("content").toLowerCase() : "";
                if (assistantMsg.contains("log your workout") || assistantMsg.contains("what exercise did you do") || assistantMsg.contains("track your workout")) {
                    return true;
                }
            }
        }

        return false;
    }

    public List<WorkoutResponse> processWorkoutFromText(UUID userId, String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        List<ParsedWorkoutItem> items = extractWorkoutItemsHeuristically(text);
        List<WorkoutResponse> responses = new ArrayList<>();
        for (ParsedWorkoutItem item : items) {
            try {
                WorkoutResponse resp = logParsedWorkoutItem(userId, item);
                if (resp != null) responses.add(resp);
            } catch (Exception e) {
                log.warn("Failed to process workout from text '{}': {}", item.getExercise(), e.getMessage());
            }
        }
        return responses;
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

    public List<ParsedWorkoutItem> extractWorkoutItemsHeuristically(String text) {
        List<ParsedWorkoutItem> items = new ArrayList<>();
        if (text == null || text.isBlank()) return items;

        String cleaned = text.replaceAll("(?i)^(please\\s+)?(log\\s+(my\\s+)?workout(:|\\s+)?|log\\s+(my\\s+)?exercise(:|\\s+)?|log\\s+|add\\s+(workout\\s+)?to\\s+(my\\s+)?(workout\\s+)?log(:|\\s+)?|add\\s+|i\\s+(just\\s+)?(worked out|exercised|trained|did|completed)?\\s*|track\\s+(my\\s+)?(workout|exercise)?(:|\\s+)?)", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\s+to\\s+(my\\s+)?(workout\\s+)?log$", "").trim();

        // Extract calories if mentioned anywhere in the statement (e.g. "burned 250 kcal" or "and burned 350 calories")
        Double globalCalories = null;
        Matcher globalCalMatcher = Pattern.compile("(?i)(\\d+(?:\\.\\d+)?)\\s*(?:kcal|calories|cal(?:s)?)(?:\\s+burned)?").matcher(cleaned);
        if (globalCalMatcher.find()) {
            try {
                globalCalories = Double.parseDouble(globalCalMatcher.group(1));
                cleaned = cleaned.replace(globalCalMatcher.group(0), " ");
            } catch (Exception ignored) {}
        }
        cleaned = cleaned.replaceAll("(?i)\\b(and\\s+)?(burned|burn)\\b", " ").trim();

        // Check if there are multiple exercises separated by ',' or 'and'
        String[] parts = cleaned.split("(?i)\\s*(?:,|\\band\\b|\\&|\\+)\\s*");

        for (String part : parts) {
            String p = part.trim();
            if (p.isBlank() || p.length() < 2) continue;

            // Extract duration if mentioned (e.g. "30 mins", "45 minutes", "1 hour")
            Integer duration = null;
            Matcher durMatcher = Pattern.compile("(?i)(\\d+(?:\\.\\d+)?)\\s*(?:min(?:ute)?s?|mins?)\\b").matcher(p);
            if (durMatcher.find()) {
                try {
                    duration = (int) Math.round(Double.parseDouble(durMatcher.group(1)));
                    p = p.replace(durMatcher.group(0), " ").trim();
                } catch (Exception ignored) {}
            } else {
                Matcher hrMatcher = Pattern.compile("(?i)(\\d+(?:\\.\\d+)?|an?|one|two)\\s*(?:hours?|hrs?)\\b").matcher(p);
                if (hrMatcher.find()) {
                    String hrStr = hrMatcher.group(1).toLowerCase();
                    double hrs = switch (hrStr) {
                        case "a", "an", "one" -> 1.0;
                        case "two" -> 2.0;
                        default -> {
                            try { yield Double.parseDouble(hrStr); } catch (Exception e) { yield 1.0; }
                        }
                    };
                    duration = (int) Math.round(hrs * 60);
                    p = p.replace(hrMatcher.group(0), " ").trim();
                }
            }

            // Extract sets and reps if mentioned
            Integer sets = null;
            Integer reps = null;
            Matcher setsRepsMatcher = Pattern.compile("(?i)(\\d+)\\s*(?:sets?)\\s*(?:of|x)?\\s*(\\d+)?\\s*(?:reps?|repetitions?)?").matcher(p);
            if (setsRepsMatcher.find()) {
                try {
                    sets = Integer.parseInt(setsRepsMatcher.group(1));
                    if (setsRepsMatcher.group(2) != null) {
                        reps = Integer.parseInt(setsRepsMatcher.group(2));
                    }
                    p = p.replace(setsRepsMatcher.group(0), " ").trim();
                } catch (Exception ignored) {}
            } else {
                Matcher xMatcher = Pattern.compile("(?i)(\\d+)\\s*x\\s*(\\d+)").matcher(p);
                if (xMatcher.find()) {
                    try {
                        sets = Integer.parseInt(xMatcher.group(1));
                        reps = Integer.parseInt(xMatcher.group(2));
                        p = p.replace(xMatcher.group(0), " ").trim();
                    } catch (Exception ignored) {}
                } else {
                    Matcher repsOnlyMatcher = Pattern.compile("(?i)(\\d+)\\s*(?:reps?|repetitions?)\\b").matcher(p);
                    if (repsOnlyMatcher.find()) {
                        try {
                            reps = Integer.parseInt(repsOnlyMatcher.group(1));
                            sets = 1;
                            p = p.replace(repsOnlyMatcher.group(0), " ").trim();
                        } catch (Exception ignored) {}
                    }
                }
            }

            // Clean exercise text from conjunctions / preposition words
            String exerciseName = p.replaceAll("(?i)\\b(for|of|in|today|session|workout|i|just)\\b", " ")
                    .replaceAll("\\s+", " ").trim();

            exerciseName = normalizeExerciseName(exerciseName);
            if (exerciseName.isBlank() || exerciseName.length() < 2) {
                if (duration == null && sets == null && reps == null) {
                    continue; // Skip noise fragments
                }
                exerciseName = "Workout";
            }

            if (duration == null) {
                if (sets != null) {
                    duration = Math.max(10, sets * 4);
                } else {
                    duration = 20;
                }
            }

            Double caloriesBurned = globalCalories != null ? globalCalories : workoutService.estimateCaloriesBurned(exerciseName, duration);

            items.add(ParsedWorkoutItem.builder()
                    .exercise(capitalizeWords(exerciseName))
                    .duration(duration)
                    .sets(sets)
                    .reps(reps)
                    .caloriesBurned(caloriesBurned)
                    .build());
        }

        return items;
    }

    private String normalizeExerciseName(String raw) {
        if (raw == null) return "Workout";
        String lower = raw.toLowerCase().trim();
        if (lower.contains("ran") || lower.contains("running") || lower.contains("run")) return "Running";
        if (lower.contains("jogged") || lower.contains("jogging") || lower.contains("jog")) return "Jogging";
        if (lower.contains("walked") || lower.contains("walking") || lower.contains("walk")) return "Walking";
        if (lower.contains("cycled") || lower.contains("cycling") || lower.contains("bike") || lower.contains("biking")) return "Cycling";
        if (lower.contains("swam") || lower.contains("swimming") || lower.contains("swim")) return "Swimming";
        if (lower.contains("hiit") || lower.contains("interval")) return "HIIT";
        if (lower.contains("yoga")) return "Yoga";
        if (lower.contains("pilates")) return "Pilates";
        if (lower.contains("bench press") || lower.contains("bench")) return "Bench Press";
        if (lower.contains("squat")) return "Squats";
        if (lower.contains("deadlift")) return "Deadlifts";
        if (lower.contains("push up") || lower.contains("pushup") || lower.contains("push-up")) return "Push-ups";
        if (lower.contains("pull up") || lower.contains("pullup") || lower.contains("pull-up")) return "Pull-ups";
        if (lower.contains("bicep") || lower.contains("curl")) return "Bicep Curls";
        if (lower.contains("plank")) return "Plank";
        if (lower.contains("jump rope") || lower.contains("skipping")) return "Jump Rope";
        if (lower.contains("gym") || lower.contains("weight")) return "Weight Training";
        if (lower.contains("cardio")) return "Cardio";
        return capitalizeWords(raw.trim());
    }

    private String buildWorkoutLoggedReply(List<WorkoutResponse> loggedWorkouts) {
        StringBuilder sb = new StringBuilder("💪 **Logged to your Workouts:**\n\n");
        int totalMinutes = 0;
        double totalCal = 0;
        for (WorkoutResponse w : loggedWorkouts) {
            sb.append("• **").append(w.getExercise()).append("** — ");
            if (w.getDuration() != null && w.getDuration() > 0) {
                sb.append(w.getDuration()).append(" min");
            }
            if (w.getSets() != null && w.getSets() > 0) {
                sb.append(" (").append(w.getSets()).append(" sets");
                if (w.getReps() != null && w.getReps() > 0) {
                    sb.append(" × ").append(w.getReps()).append(" reps");
                }
                sb.append(")");
            }
            if (w.getCaloriesBurned() != null && w.getCaloriesBurned() > 0) {
                sb.append(" · **").append(Math.round(w.getCaloriesBurned())).append(" kcal** burned");
            }
            sb.append("\n");
            totalMinutes += w.getDuration() != null ? w.getDuration() : 0;
            totalCal += w.getCaloriesBurned() != null ? w.getCaloriesBurned() : 0;
        }
        sb.append("\n**Total Active Time:** ").append(totalMinutes).append(" mins");
        if (totalCal > 0) {
            sb.append(" · **Est. Burned:** ").append(Math.round(totalCal)).append(" kcal");
        }
        sb.append(".\n\nAwesome work staying active today! Your Workout log and Dashboard have been updated.");
        return sb.toString();
    }

    private String buildCombinedLoggedReply(List<FoodLogResponse> loggedFoods, List<WorkoutResponse> loggedWorkouts) {
        StringBuilder sb = new StringBuilder();
        sb.append(buildFoodLoggedReply(loggedFoods));
        sb.append("\n\n---\n\n");
        sb.append(buildWorkoutLoggedReply(loggedWorkouts));
        return sb.toString();
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
