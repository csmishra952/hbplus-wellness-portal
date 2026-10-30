# HB+ (`hbplus.fit`) — Integrated Wellness & Coaching Platform

A cross-platform health, strength, precision nutrition, and mental wellness web & mobile application built for **HB+ (`hbplus.fit`)**, featuring strict `@hbplus.fit` Google OAuth domain enforcement, PostgreSQL Row-Level Security (Supabase), an interactive Member Telemetry Hub, and a Coach & Admin Command Portal.

---

## Live Demo

- **Production URL:** `https://your-hbplus-site.netlify.app` *(Update with your live Netlify link after deployment)*
- **Recruiter Testing Sandbox:** Built directly into `/login` — test **Verified Member (`member@hbplus.fit`)**, **Blocked External Account (`user@gmail.com`)**, and **Coach & Admin (`admin@hbplus.fit`)** flows in one click without needing corporate credentials.

---

## Core Architecture & Features

### 1. Public Brand Ecosystem (`/`)
- **Responsive Design System:** Obsidian dark aesthetic (`#0A0C10` / `#161922`) with energetic Neon Lime (`#CCFF00`) and Biometric Cyan (`#00E5FF`) accents, engineered cleanly across Mobile (`360px–480px`), Tablet (`768px–1024px`), and Desktop (`1280px+`).
- **Interactive Body Intelligence & Longevity Map:** Anatomical SVG silhouette with interactive `Mind & ANS`, `Metabolic & Gut`, and `Musculoskeletal` telemetry hotspots.
- **The 4-Pillar Methodology:** Personal Strength Coaching, Diagnostic Biomarker Labs, Precision Macro Nutrition, and Autonomic Recovery Sanctuary (Hop Studio).

### 2. Google OAuth & `@hbplus.fit` Domain Restriction (`/login`)
- **Supabase Google OAuth (`signInWithOAuth`):** Authenticates users via Google and inspects the verified account email on session hydration.
- **Strict Domain Gate:**
  - **Allowed (`@hbplus.fit` or admin-whitelisted domains):** Persists session, upserts the user profile and daily wellness log in Supabase PostgreSQL (`profiles` and `wellness_logs`), and routes to `/dashboard`.
  - **Rejected (e.g., `@gmail.com`):** Immediately invokes `supabase.auth.signOut()`, clears session state, keeps the user on `/login`, and displays: *"Access restricted. Please login using your official domain email."*
- **Recruiter Testing Sandbox:** Instant 1-click role switcher on `/login` to evaluate Member, Blocked User, and Coach/Admin workflows seamlessly.

### 3. Member Telemetry Dashboard (`/dashboard` — Member View)
- **Top Biometric Strip:** Animated Recovery Ring (`HRV` & `RHR`), Sleep Architecture stages (`Deep`, `REM`, `Light`), Daily 4-Pillar Alignment bar, and interactive 7-Day Adherence Heatmap.
- **Pillar 01 — Interactive Strength Tracker:** Per-set completion checkboxes, automatic **60-second live rest countdown timer**, progressive overload load steppers (`±2.5 kg`), and real-time session tonnage calculation.
- **Pillar 02 — Dynamic Precision Nutrition:** Caloric fuel gauge, 3 responsive concentric SVG Macro Rings (`Protein`, `Carbs`, `Fats`), and 1-tap clinical meal logging synced to PostgreSQL.
- **Pillar 03 — Guided 4-7-8 Breathwork:** Kinetic autonomic down-regulation breathing orb (`4s Inhale · 7s Hold · 8s Exhale`) with live phase countdown and mindfulness streak tracking.
- **Pillar 04 — Vitals & Hydration:** Daily step progress bar (`+1,000 steps` quick logger) and interactive 8-glass (`250 ml`) hydration grid.

### 4. Coach & Admin Command Portal (`/dashboard` — Admin RBAC View)
- **Coach KPI Strip & Searchable Athlete Roster:** Filter athletes by readiness alerts (`Needs Attention < 60%`), `Strength Hypertrophy`, or `Metabolic Reset`.
- **Athlete Deep-Dive Client File:**
  - **Program & Split Editor:** Swap exercises, adjust sets/reps/loads, or apply a 1-click **10% Autonomic Volume Deload** when HRV drops.
  - **Macro Protocol Manager:** Interactive sliders for Calories, Protein, Carbs, and Fats with live Member Dashboard sync.
  - **Coach Feedback Notes & Domain Whitelist Governance:** Post timestamped clinical notes and manage authorized corporate email domains (`domain_settings`).

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (`motion/react`), Lucide Icons
- **Authentication & Database:** Supabase (`@supabase/supabase-js` — Google OAuth + PostgreSQL with Row-Level Security)
- **Deployment:** Netlify (SPA edge routing configured via `netlify.toml`)

---

## Clean Folder Structure

```text
hbplus-app/
├── src/
│   ├── assets/images/           # Bundled high-resolution studio, pillar & avatar imagery
│   ├── components/              # Modular dashboard & navigation components
│   │   ├── BreathworkWidget.tsx
│   │   ├── Header.tsx
│   │   ├── NutritionPillarCard.tsx
│   │   ├── StrengthPillarCard.tsx
│   │   └── VitalsPillarCard.tsx
│   ├── config/
│   │   └── supabase.ts          # Cross-platform Supabase client & domain validator
│   ├── constants/
│   │   ├── assets.ts            # Vite static asset manifest
│   │   └── theme.ts             # HB+ color tokens & workout split presets
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state, @hbplus.fit gate, RBAC & DB sync
│   ├── screens/
│   │   ├── AdminScreen.tsx      # Coach & Admin Command Portal
│   │   ├── DashboardScreen.tsx  # Member Telemetry Dashboard
│   │   ├── LandingPage.tsx      # Public HB+ Ecosystem Landing Page
│   │   └── LoginScreen.tsx      # Split-screen Google OAuth & Recruiter Sandbox
│   ├── App.tsx                  # Route guard & navigation shell (/, /login, /dashboard)
│   ├── index.css                # Tailwind v4 theme, safe-area & responsive utilities
│   └── main.tsx                 # Application entry point
├── supabase/
│   └── schema.sql               # Idempotent PostgreSQL tables & RLS policies
├── .env.example                 # Environment variable template (safe to commit)
├── index.html                   # HTML entry with Outfit, Plus Jakarta Sans & JetBrains Mono
├── netlify.toml                 # Netlify build config, Node 22 & SPA redirect rules
├── package.json                 # Scripts & dependencies
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite bundler configuration
```

---

## Local Development Setup

### 1. Prerequisites
- **Node.js v20.19+ or v22+** (`node -v`)
- **npm** (`npm -v`)
- A free **Supabase** project (`https://supabase.com`) with Google OAuth configured

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the root folder and add your Supabase credentials:

```env
VITE_ALLOWED_DOMAIN=hbplus.fit
EXPO_PUBLIC_ALLOWED_DOMAIN=hbplus.fit

VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"

EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
```

### 4. Initialize Supabase Database Schema
Open **Supabase Dashboard → SQL Editor → New Query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run** to create `profiles`, `wellness_logs`, `domain_settings`, and all Row-Level Security (RLS) policies.

### 5. Start the Development Server
```bash
npm run dev
```
- **Desktop Web:** Open `http://localhost:3000`
- **Mobile Phone (Same Wi-Fi):** Open the `Network: http://192.168.x.x:3000` URL printed in your terminal on iOS Safari or Android Chrome.

---

## Production Build & Netlify Deployment

```bash
npm run build
```

1. Push the repository to GitHub (`.env` and `node_modules` are automatically excluded via `.gitignore`).
2. Import the repository in **Netlify** (`Build command: npm run build`, `Publish directory: dist` — automatically configured via `netlify.toml`).
3. Add `VITE_ALLOWED_DOMAIN`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` under **Netlify → Site configuration → Environment variables**.
4. Add your live `https://<your-site>.netlify.app` URL to **Supabase → Authentication → URL Configuration** (`Site URL` and `Redirect URLs: https://<your-site>.netlify.app/**`).
