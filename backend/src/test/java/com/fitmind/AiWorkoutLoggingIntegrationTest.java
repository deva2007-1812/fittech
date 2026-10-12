package com.fitmind;

import com.fitmind.ai.AiService;
import com.fitmind.dto.*;
import com.fitmind.entity.User;
import com.fitmind.repository.UserRepository;
import com.fitmind.service.WorkoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("AI Workout Logging Integration Tests")
class AiWorkoutLoggingIntegrationTest {

    @Autowired private AiService aiService;
    @Autowired private WorkoutService workoutService;
    @Autowired private UserRepository userRepository;

    private UUID userId;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .email("test-ai-workout-" + UUID.randomUUID() + "@example.com")
                .password("hashed")
                .name("AI Workout Tester")
                .build());
        userId = user.getId();
    }

    @Test
    @DisplayName("AI Coach chat parses and saves running workout to workout database")
    void testChatLogsWorkoutRunning() {
        AiChatRequest request = AiChatRequest.builder()
                .message("I just ran for 30 minutes and burned 250 calories")
                .build();

        AiChatResponse response = aiService.chat(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getLoggedWorkouts()).isNotEmpty();

        WorkoutResponse loggedWorkout = response.getLoggedWorkouts().get(0);
        assertThat(loggedWorkout.getExercise()).containsIgnoringCase("Run");
        assertThat(loggedWorkout.getDuration()).isEqualTo(30);
        assertThat(loggedWorkout.getCaloriesBurned()).isEqualTo(250.0);

        // Verify it immediately reflects in workoutService.getTodayWorkouts
        List<WorkoutResponse> todayWorkouts = workoutService.getTodayWorkouts(userId);
        assertThat(todayWorkouts).isNotEmpty();
        assertThat(todayWorkouts.get(0).getExercise()).containsIgnoringCase("Run");
        assertThat(workoutService.getTotalDurationToday(userId)).isGreaterThanOrEqualTo(30);
    }

    @Test
    @DisplayName("AI Coach chat parses sets and reps for strength training")
    void testChatLogsStrengthWorkout() {
        AiChatRequest request = AiChatRequest.builder()
                .message("Log workout: 3 sets of 10 bench press")
                .build();

        AiChatResponse response = aiService.chat(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getLoggedWorkouts()).isNotEmpty();

        WorkoutResponse logged = response.getLoggedWorkouts().get(0);
        assertThat(logged.getExercise()).containsIgnoringCase("Bench");
        assertThat(logged.getSets()).isEqualTo(3);
        assertThat(logged.getReps()).isEqualTo(10);
        assertThat(logged.getDuration()).isGreaterThan(0);
    }

    @Test
    @DisplayName("General fitness advice does not log workouts")
    void testGeneralQuestionDoesNotLogWorkout() {
        AiChatRequest request = AiChatRequest.builder()
                .message("How do I improve my bench press form?")
                .build();

        AiChatResponse response = aiService.chat(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getLoggedWorkouts()).isEmpty();

        List<WorkoutResponse> todayWorkouts = workoutService.getTodayWorkouts(userId);
        assertThat(todayWorkouts).isEmpty();
    }
}
