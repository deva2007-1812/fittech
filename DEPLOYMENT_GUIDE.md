# 🌐 FitMind AI - Full Stack Deployment Guide

This guide walks you through hosting your Spring Boot backend on **Render** (Free tier) and connecting it with your **Vercel** frontend and **Supabase** database.

---

## 🏗️ Architecture Overview

```
┌───────────────────────────────┐
│     Vercel (Frontend)         │  https://your-app.vercel.app
│  - React 19 + Vite + Tailwind │
└───────────────┬───────────────┘
                │
                │ HTTPS REST API (VITE_API_BASE_URL)
                ▼
┌───────────────────────────────┐
│     Render (Backend)          │  https://fitmind-backend.onrender.com
│  - Spring Boot 3 + Java 21    │
│  - Multi-stage Docker         │
│  - Gemini AI Assistant        │
└───────────────┬───────────────┘
                │
                │ Encrypted PostgreSQL Connection (Port 5432 / SSL)
                ▼
┌───────────────────────────────┐
│     Supabase (Database)       │  aws-0-ap-southeast-1.pooler.supabase.com
│  - 9 tables, indexes, triggers│
│  - 70+ seeded foods           │
└───────────────────────────────┘
```

---

## 🚀 Step 1: Deploy Backend to Render (3 Minutes)

1. Sign up or log in to [**Render.com**](https://dashboard.render.com).
2. On your dashboard, click **New +** (top right) and select **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Connect your GitHub account and select your repository: **`deva2007-1812/fittech`**.
5. Configure the Web Service details:
   - **Name**: `fitmind-backend` (or any name you prefer)
   - **Region**: `Singapore (Southeast Asia)` *(closest to your Supabase region for lowest latency)*
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `.` (or `backend`)
   - **Instance Type**: **Free**

6. Scroll down to **Advanced** > **Health Check Path**:
   - Set **Health Check Path** to: `/api/health`

7. In the **Environment Variables** section, click **Add Environment Variable** for each of these:

| Key | Value | Description |
| :--- | :--- | :--- |
| `SUPABASE_DB_URL` | `jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require` | Supabase Pooler JDBC URL (from your `backend/.env`) |
| `SUPABASE_DB_USERNAME` | `postgres.ptscynquptrcpspslcyc` | Supabase DB User (from your `backend/.env`) |
| `SUPABASE_DB_PASSWORD` | `<your-supabase-db-password>` | Supabase DB Password (from your `backend/.env`) |
| `JWT_SECRET` | `<your-jwt-secret>` | 256-bit JWT secret (from your `backend/.env`) |
| `AI_API_KEY` | `<your-gemini-ai-key>` | Google Gemini AI API key (from your `backend/.env`) |
| `ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:5173` | Allowed CORS origins |

8. Click **Deploy Web Service** (or **Create Web Service**).
9. Render will build the Docker container and start your Spring Boot service.
   - You can watch the live build logs.
   - Once complete, you will see `Tomcat started on port ...` and `==> Your service is live 🎉`.
10. Copy your live backend URL (e.g. `https://fitmind-backend-xxxx.onrender.com`).

---

## ⚡ Step 2: Connect Your Vercel Frontend (1 Minute)

1. Go to your [**Vercel Dashboard**](https://vercel.com/dashboard).
2. Click on your deployed **FitMind** frontend project.
3. Go to **Settings** > **Environment Variables**.
4. Add a new variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://<YOUR-RENDER-BACKEND-URL>/api`
     *(Example: `https://fitmind-backend-xxxx.onrender.com/api` — make sure to include `/api` at the end!)*
   - **Environments**: Check **Production**, **Preview**, and **Development**.
5. Click **Save**.
6. Trigger a redeployment so the new environment variable is baked into the build:
   - Go to the **Deployments** tab.
   - Click the three dots `...` next to the latest deployment > **Redeploy**.

---

## 🔍 Step 3: Verify Your Deployment

1. **Verify Backend**:
   - Open `https://<YOUR-RENDER-BACKEND-URL>/api/health` in your browser.
   - You should see:
     ```json
     {
       "status": "UP",
       "service": "FitMind AI Backend",
       "version": "1.0.0",
       "timestamp": "..."
     }
     ```
   - You can also view the interactive Swagger docs at:
     `https://<YOUR-RENDER-BACKEND-URL>/swagger-ui.html`

2. **Verify Full-Stack Flow**:
   - Open your Vercel frontend URL (e.g., `https://fittech.vercel.app`).
   - Register a new account (e.g., `user@example.com`).
   - Complete the onboarding questionnaire (height, weight, goals).
   - Test the features:
     - Log a meal or search from the 70+ Indian & global reference foods.
     - Log water intake and workout.
     - Open the **AI Coach** tab and chat with Gemini AI.
     - View the real-time progress charts and daily summaries.

---

## 💡 Important Notes

- **Render Free Tier Spin-Down**: Free Render instances spin down after 15 minutes of inactivity. The first request after sleep may take ~30-45 seconds to wake up. This is normal on the free tier.
- **CORS Support**: The backend is configured to accept all `*.vercel.app` subdomains automatically. If you later attach a custom domain (e.g., `https://fitmind.ai`), simply add it to `ALLOWED_ORIGINS` in Render environment variables.
- **SPA Routing on Vercel**: `vercel.json` has been included in the repository, so refreshing pages like `/dashboard`, `/nutrition`, or `/login` will never return 404.
