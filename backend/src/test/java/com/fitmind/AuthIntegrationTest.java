package com.fitmind;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitmind.dto.LoginRequest;
import com.fitmind.dto.RegisterRequest;
import com.fitmind.entity.User;
import com.fitmind.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Auth Integration Tests")
class AuthIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static final String TEST_EMAIL = "test@fitmind.ai";
    private static final String TEST_PASSWORD = "SecurePass123";
    private static final String TEST_NAME = "Test User";

    @Test
    @Order(1)
    @DisplayName("Register a new user returns 201 with tokens")
    void testRegister() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name(TEST_NAME)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.tokens.accessToken").exists())
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @Order(2)
    @DisplayName("Register with same email returns 409")
    void testDuplicateEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name(TEST_NAME)
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(3)
    @DisplayName("Login with correct credentials returns access token")
    void testLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(TEST_EMAIL)
                .password(TEST_PASSWORD)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokens.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @Order(4)
    @DisplayName("Login with wrong password returns 401")
    void testLoginWrongPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(TEST_EMAIL)
                .password("WrongPassword!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    @DisplayName("Register with invalid email returns 400")
    void testRegisterInvalidEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test")
                .email("not-an-email")
                .password("SecurePass123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    @DisplayName("Protected endpoint without token returns 401/403")
    void testProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(post("/api/workouts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isIn(401, 403));
    }

    @Test
    @Order(7)
    @DisplayName("Password is BCrypt hashed in database")
    void testPasswordIsHashed() {
        User user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        assertThat(user.getPassword()).startsWith("$2a$") // BCrypt prefix
                .isNotEqualTo(TEST_PASSWORD);
    }
}
