# FitMind AI Backend

> **Personalized Fitness & Nutrition Assistant – Spring Boot 3 REST API**

[![Java](https://img.shields.io/badge/Java-21+-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Tests-15%20passing-success)](/)

---

## Quick Start

### 1. Prerequisites
| Tool | Version |
|------|---------|
| Java | 21+ (tested on 26) |
| Maven | 3.9.x (`C:\tools\apache-maven-3.9.6\`) |
| PostgreSQL | Supabase project |
| Google Gemini API Key | [ai.google.dev](https://ai.google.dev) |

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
# Supabase connection string
SUPABASE_DB_URL=jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-database-password

# JWT (min 32 characters)
JWT_SECRET=your-super-secret-256-bit-key-change-this-in-production!

# Gemini AI
AI_API_KEY=your-google-gemini-api-key
AI_ENABLED=true

# CORS (frontend origins)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Then set as PowerShell env vars:

```powershell
Get-Content .env | ForEach-Object {
    if ($_ -match "^(.+)=(.+)$") {
        [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2])
    }
}
```

### 3. Run

```powershell
# Development (hot reload)
& "C:\tools\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run

# Or run the pre-built JAR
java -jar target/fitmind-backend-1.0.0.jar
```

Server starts at `http://localhost:8080`

### 4. Test

```powershell
& "C:\tools\apache-maven-3.9.6\bin\mvn.cmd" test
```

**Result:** `Tests run: 15, Failures: 0, Errors: 0` ✅

---

## API Reference

Swagger UI is available at: **`http://localhost:8080/swagger-ui.html`**

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login → JWT tokens |
| `POST` | `/api/auth/refresh` | ❌ | Refresh access token |

### User & Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/me` | Get current user |
| `GET/PUT` | `/api/users/profile` | Get/update fitness profile |
| `GET` | `/api/users/targets` | Get daily macro/water targets |
| `POST` | `/api/users/calculate` | Calculate targets from profile |

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/nutrition/logs?date=YYYY-MM-DD` | Get food logs for date |
| `POST` | `/api/nutrition/logs` | Log a food entry |
| `DELETE` | `/api/nutrition/logs/{id}` | Delete food log |
| `GET` | `/api/nutrition/search?q=query` | Search food database |
| `POST` | `/api/nutrition/natural` | Parse natural language food input (AI) |
| `GET` | `/api/nutrition/summary?date=YYYY-MM-DD` | Daily macro summary |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workouts?date=YYYY-MM-DD` | Get workouts by date |
| `POST` | `/api/workouts` | Log a workout |
| `DELETE` | `/api/workouts/{id}` | Delete workout |

### Water & Sleep
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/water/today` | Today's water log + total |
| `POST` | `/api/water` | Log water intake |
| `GET` | `/api/sleep?date=YYYY-MM-DD` | Get sleep log |
| `POST` | `/api/sleep` | Log sleep |

### Weight & Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/weight` | Get history / log weight |
| `GET` | `/api/progress?days=30` | Progress chart data |
| `GET` | `/api/dashboard` | Daily summary dashboard |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Chat with AI fitness assistant |
| `GET` | `/api/ai/insights` | Get personalized AI insights |

---

## Architecture

```
src/main/java/com/fitmind/
├── FitMindApplication.java
├── ai/                     # Gemini AI integration
│   ├── AiService.java      # Gemini API calls (WebFlux WebClient)
│   └── AiContextService.java # Assembles user context for AI
├── config/
│   ├── SecurityConfig.java # JWT filter chain, public/protected routes
│   ├── AppConfig.java      # WebClient bean
│   └── OpenApiConfig.java  # Swagger/OpenAPI configuration
├── controller/             # 11 REST controllers
├── dto/                    # 31 request/response DTOs (Lombok @Builder)
├── entity/                 # 9 JPA entities + enums
├── exception/              # GlobalExceptionHandler + domain exceptions
├── fitness/
│   └── FitnessCalculationService.java  # BMR, TDEE, macro math (no AI)
├── nutrition/
│   └── NutritionService.java           # Food logging + natural language
├── repository/             # 9 Spring Data JPA repositories
├── security/
│   ├── JwtUtil.java                    # JJWT 0.12.x token ops
│   ├── JwtAuthenticationFilter.java    # Bearer token extraction
│   └── UserDetailsServiceImpl.java
├── service/                # 8 domain services
└── util/
    └── AuthUtils.java      # SecurityContext → UUID helper
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Math stays in Java** | All BMR/TDEE/macro calculations in `FitnessCalculationService` — AI never does arithmetic |
| **AI for language only** | Gemini used only to parse natural language food descriptions and for chat |
| **`AuthUtils.getCurrentUserId()`** | Controllers never trust user IDs from request bodies |
| **JPQL over native SQL** | JPQL queries are portable across PostgreSQL (prod) and H2 (tests) |
| **Flyway migrations** | Schema versioned in `V1–V10` SQL files; `baseline-on-migrate=true` for existing DBs |

---

## Database Schema

```
users ──────────────────────────── user_profiles
  │                                     (1:1)
  ├── food_logs (N:1)
  ├── workout_logs (N:1)
  ├── water_logs (N:1)
  ├── sleep_logs (N:1)
  ├── weight_history (N:1)
  └── daily_summaries (N:1)

foods ── (referenced by food_logs)
```

---

## Notes for Deployment

- **Supabase**: Enable the **pgvector** extension if you later want semantic food search
- **pg_trgm**: The V3 migration enables `pg_trgm` and creates a GIN index on `foods(name)` for fast fuzzy search
- **CORS**: Update `ALLOWED_ORIGINS` to your production frontend URL
- **JWT Secret**: Generate with `openssl rand -base64 32`
