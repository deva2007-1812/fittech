package com.fitmind;

import com.fitmind.ai.AiService;
import com.fitmind.dto.*;
import com.fitmind.entity.User;
import com.fitmind.nutrition.NutritionService;
import com.fitmind.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("AI Food Logging Integration Tests")
class AiFoodLoggingIntegrationTest {

    @Autowired private AiService aiService;
    @Autowired private NutritionService nutritionService;
    @Autowired private UserRepository userRepository;

    private UUID userId;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .email("test-ai-food-" + UUID.randomUUID() + "@example.com")
                .password("hashed")
                .name("AI Food Tester")
                .build());
        userId = user.getId();
    }

    @Test
    @DisplayName("AI Coach chat parses and saves food to nutrition database")
    void testChatLogsFoodToNutrition() {
        AiChatRequest request = AiChatRequest.builder()
                .message("Log 2 eggs for breakfast")
                .build();

        AiChatResponse response = aiService.chat(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getLoggedFoods()).isNotEmpty();

        FoodLogResponse loggedFood = response.getLoggedFoods().get(0);
        assertThat(loggedFood.getFoodName()).containsIgnoringCase("egg");
        assertThat(loggedFood.getCalories()).isGreaterThan(0.0);

        // Verify it immediately reflects in nutritionService.getTodayLog
        NutritionLogResponse todayLog = nutritionService.getTodayLog(userId);
        assertThat(todayLog).isNotNull();
        assertThat(todayLog.getEntries()).isNotEmpty();
        assertThat(todayLog.getTotals().getCalories()).isGreaterThan(0.0);
    }

    @Test
    @DisplayName("General questions do not log foods")
    void testGeneralQuestionDoesNotLogFood() {
        AiChatRequest request = AiChatRequest.builder()
                .message("How many minutes of cardio should I do?")
                .build();

        AiChatResponse response = aiService.chat(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getLoggedFoods()).isEmpty();

        NutritionLogResponse todayLog = nutritionService.getTodayLog(userId);
        assertThat(todayLog.getEntries()).isEmpty();
    }
}
