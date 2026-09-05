# ⚡ Supabase Setup Guide for FitMind AI

FitMind AI is natively architected to use **Supabase (PostgreSQL)** as its database.

---

## 🚀 Quick Setup (2 Options)

### Option 1: Automatic Setup via Spring Boot (Recommended)
You don't need to manually run any SQL! Spring Boot and Flyway will automatically detect your Supabase database, create all tables, indexes, triggers, and seed 70+ verified reference foods on startup.

1. In the `backend` directory, create a `.env` file (copy from [`.env.example`](file:///d:/fittech/backend/.env.example)):
   ```properties
   # Supabase Connection Pooler (Session Mode, Port 5432 - Recommended for all networks)
   SUPABASE_DB_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   SUPABASE_DB_USERNAME=postgres.<your-project-ref>
   SUPABASE_DB_PASSWORD=your-supabase-database-password

   JWT_SECRET=your-random-256-bit-secret-key-at-least-32-chars-long
   AI_API_KEY=your-gemini-api-key
   ```
2. Start the backend:
   ```powershell
   cd d:\fittech\backend
   & "C:\tools\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
   ```
3. Flyway migrations (`V1` to `V10`) will execute automatically!

---

### Option 2: 1-Click Setup via Supabase SQL Editor
If you prefer initializing the database directly in the Supabase Dashboard:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project and navigate to the **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Open [**`supabase_schema.sql`**](file:///d:/fittech/supabase_schema.sql) in this repository, copy the entire content, paste it into the editor, and click **Run** (or `Ctrl + Enter`).
5. All 9 tables, indexes, triggers, and 70+ nutrition foods will be created immediately.

---

## 🔑 Where to Find Your Supabase Credentials

1. Go to your **Supabase Project Dashboard**.
2. Click **Project Settings** (gear icon in the bottom-left) > **Database**.
3. Scroll down to **Connection parameters** or **Connection string**:
   - **Host**: e.g., `aws-0-ap-south-1.pooler.supabase.com` (for pooler) or `db.<ref>.supabase.co` (direct)
   - **Port**: `5432` (or `6543`)
   - **Database**: `postgres`
   - **User**: `postgres.<project-ref>` (for pooler) or `postgres` (direct)
   - **Password**: Your database password set during project creation.

> [!TIP]
> FitMind AI's `EnvLoader` is intelligent: If you paste the raw Supabase URI (e.g., `postgresql://postgres.xxx:pass@aws-0-xxx.pooler.supabase.com:5432/postgres`), it will automatically parse the credentials and append `sslmode=require`!

---

## 📊 Database Schema Overview

| Table | Description |
| :--- | :--- |
| [`users`](file:///d:/fittech/supabase_schema.sql#L30-L37) | Registered user accounts with BCrypt-hashed passwords |
| [`user_profiles`](file:///d:/fittech/supabase_schema.sql#L46-L61) | Height, weight, activity level, calculated BMR/TDEE and macro targets |
| [`foods`](file:///d:/fittech/supabase_schema.sql#L70-L83) | 70+ reference foods (Indian staples, fruits, vegetables, proteins) with trigram search |
| [`food_logs`](file:///d:/fittech/supabase_schema.sql#L90-L104) | Daily food intake entries with calculated calories & macros |
| [`workout_logs`](file:///d:/fittech/supabase_schema.sql#L112-L124) | Exercise type, duration, sets, reps, and calories burned |
| [`water_logs`](file:///d:/fittech/supabase_schema.sql#L131-L137) | Water hydration logs in milliliters |
| [`sleep_logs`](file:///d:/fittech/supabase_schema.sql#L144-L154) | Sleep duration, bedtime, and wake time |
| [`weight_history`](file:///d:/fittech/supabase_schema.sql#L161-L167) | Historical bodyweight measurements for trend charting |
| [`daily_summaries`](file:///d:/fittech/supabase_schema.sql#L174-L187) | Pre-aggregated daily metrics for instant dashboard and progress views |
