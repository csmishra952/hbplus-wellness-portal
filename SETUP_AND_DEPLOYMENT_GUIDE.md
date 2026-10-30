# Complete Step-by-Step Guide: Supabase + Google OAuth, Local Testing, GitHub & Netlify Deployment

This guide assumes **zero prior experience** with Supabase, Google Cloud Console, Git/GitHub, or Netlify. Follow every step in exact order—nothing is skipped.

---

## IMPORTANT FIRST STEP: Update Your VS Code Files Before Starting

A few important production upgrades were just added to your project so that **live Supabase PostgreSQL sync**, **image bundling on Netlify**, and **Netlify `/login` + `/dashboard` URL routing** work without any errors:

1. **Re-export / copy the latest files** from this project into your `hbplus-app` folder in VS Code (especially):
   - `netlify.toml` *(NEW — tells Netlify to use Node 22, build `dist`, and prevent 404 errors on `/login` and `/dashboard`)*
   - `README.md` *(UPDATED — clean, recruiter-ready documentation)*
   - `supabase/schema.sql` *(UPDATED — safe to run multiple times without errors)*
   - `src/constants/assets.ts` *(NEW — ensures all 14 images load properly on Netlify)*
   - `src/config/supabase.ts` *(UPDATED — persists Google OAuth sessions cleanly across redirects)*
   - `src/context/AuthContext.tsx` *(UPDATED — connects Google OAuth directly to your Supabase `profiles` & `wellness_logs` tables)*
   - `src/screens/LandingPage.tsx` & `src/screens/LoginScreen.tsx` *(UPDATED — uses bundled assets)*
   - `package.json` *(UPDATED — sets project name to `hbplus-app`)*

---

## PART 1: Set Up Supabase (Database + Tables + Security)

### Step 1.1 — Create Your Free Supabase Project
1. Open your browser and go to **[https://supabase.com](https://supabase.com)**.
2. Click **Start your project** (top right) and sign in with your GitHub or Google account.
3. If asked to create an Organization, name it `HBPlus` (Free Plan) and click **Create organization**.
4. Click **New project**:
   - **Name:** `hbplus-app`
   - **Database Password:** Click **Generate a password**, copy it somewhere safe (you rarely need it, as we use the SQL Editor), and wait a moment.
   - **Region:** Pick the region closest to you (for example, `South Asia (Mumbai)` or `US East`).
5. Click **Create new project**.
6. Wait **60–90 seconds** until the green status indicator says your project is active.

---

### Step 1.2 — Create Your Database Tables (`schema.sql`)
1. In your Supabase project left sidebar, click **SQL Editor** (the icon looks like `>_` terminal).
2. Click **+ New query**.
3. Go to your **VS Code**, open the file `supabase/schema.sql`, press **`Ctrl + A`** (or `Cmd + A` on Mac) to select everything, and **`Ctrl + C`** to copy it.
4. Go back to the **Supabase SQL Editor**, paste the code into the editor box, and click the green **Run** button (bottom right).
5. You should see **`Success. No rows returned`** at the bottom.
6. **Verify your tables were created:**
   - Click **Table Editor** in the left sidebar (grid icon).
   - Confirm you see 3 tables listed:
     - `domain_settings` *(already pre-filled with `hbplus.fit`!)*
     - `profiles`
     - `wellness_logs`

---

### Step 1.3 — Copy Your Supabase URL & Anon Key into VS Code `.env`
1. In your Supabase left sidebar, click **Project Settings** (the gear ⚙️ icon at the very bottom).
2. In the Settings menu, click **Data API** (or **API**).
3. Find **Project URL** — click **Copy** (it looks like `https://abcdefghijklm.supabase.co`).
4. Scroll down to **Project API keys** and find the **`anon` `public`** key (or **Publishable key**) — click **Copy** (do **NOT** use the `service_role` secret key in frontend `.env`!).
5. Go to **VS Code** and open your `.env` file. Update it so it looks exactly like this (paste your real URL and key inside the quotes):

```env
# Core Requirement
VITE_ALLOWED_DOMAIN=hbplus.fit
EXPO_PUBLIC_ALLOWED_DOMAIN=hbplus.fit

# Local development URL
APP_URL=http://localhost:3000

# Supabase Credentials (paste the same URL & anon key in both VITE_ and EXPO_PUBLIC_)
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
6. Press **`Ctrl + S`** (`Cmd + S` on Mac) to save `.env`.

---

## PART 2: Set Up Google OAuth (Google Cloud + Supabase)

To make the **"Continue with Google"** button work for real, Google needs to trust your Supabase project.

### Step 2.1 — Copy Your Supabase Callback URL First
1. In your **Supabase Dashboard**, look at the left sidebar and click **Authentication** (the padlock icon).
2. Under **Configuration**, click **Sign In / Providers** (or **Providers**).
3. Scroll down and click **Google** to expand it.
4. Toggle **Enable Sign in with Google** to **ON**.
5. Look for the **Callback URL (for OAuth)** box — it looks like:
   `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
6. Click **Copy** next to that Callback URL. Keep this Supabase tab open!

---

### Step 2.2 — Create Google OAuth Credentials in Google Cloud Console
1. Open a new browser tab and go to **[https://console.cloud.google.com/](https://console.cloud.google.com/)**.
2. Sign in with your Google account.
3. At the top-left (next to the Google Cloud logo), click the **Project dropdown** → click **New Project** (top right of popup):
   - **Project name:** `HBPlus Wellness Auth`
   - Click **Create**, wait 5 seconds, and click **Select Project** in the notification popup so `HBPlus Wellness Auth` is selected at the top.
4. Configure the **OAuth Consent Screen**:
   - In the top search bar of Google Cloud Console, type **`OAuth consent screen`** and click it (Google may call this **Google Auth Platform**).
   - If you see a **Get Started** button:
     1. **App Information:**
        - **App name:** `HB+ Wellness Portal`
        - **User support email:** Select your email from the dropdown. Click **Next**.
     2. **Audience:** Select **External**. Click **Next**.
     3. **Contact Information:** Type your email address. Click **Next**.
     4. **Finish:** Check *"I agree to the Google API Services: User Data Policy"* and click **Continue** → **Create**.
   - *(Note: If you see the older OAuth Consent Screen layout instead, choose **External** → **Create** → enter App Name `HB+ Wellness Portal`, User support email, and Developer contact email at the bottom → click **Save and Continue** through Scopes and Test Users → **Back to Dashboard**, then click **Publish App** so any email can test login without a 403 test-user block).*
   - In the new **Google Auth Platform** left menu, click **Audience** → if **Publishing status** says **Testing**, click **Publish App** → **Confirm** (this ensures any recruiter or `@hbplus.fit` account can test Google Sign-In without getting blocked by Google's "uninvited test user" screen).
5. Create the **Client ID & Client Secret**:
   - In the left sidebar of Google Auth Platform, click **Clients** (or go to **APIs & Services → Credentials**).
   - Click **+ Create Client** (or **+ Create Credentials → OAuth client ID**).
   - **Application type:** Select **Web application**.
   - **Name:** `HB+ Supabase Web Client`
   - Under **Authorized JavaScript origins**, click **+ Add URI** and add:
     `http://localhost:3000`
   - Under **Authorized redirect URIs**, click **+ Add URI** and paste the **Supabase Callback URL** you copied in Step 2.1:
     `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
     *(Double-check there are NO trailing spaces!)*
   - Click **Create**.
6. A popup appears showing your **Client ID** and **Client Secret**! Keep this popup open (or copy both immediately).

---

### Step 2.3 — Paste Client ID & Secret into Supabase + Set Local Redirect URL
1. Go back to your **Supabase Dashboard** tab (where **Authentication → Sign In / Providers → Google** is open).
2. Paste your Google **Client ID** into **Client IDs** (or **Client ID (for OAuth)**).
3. Paste your Google **Client Secret** into **Client Secret (for OAuth)**.
4. Click **Save** at the bottom of the Google provider box.
5. Now, in the **Supabase Authentication** left sidebar, click **URL Configuration**:
   - **Site URL:** Change it to `http://localhost:3000`
   - **Redirect URLs:** Click **Add URL**, type `http://localhost:3000/**`, and click **Save URLs**.
   - Click **Save changes** on Site URL if prompted.

Supabase + Google OAuth is now 100% live!

---

## PART 3: Run & Verify Locally (Desktop Browser + Mobile)

### Step 3.1 — Install Packages & Start the App in VS Code
1. Open **VS Code** with your `hbplus-app` folder open.
2. Open the VS Code Terminal: press **`` Ctrl + ` ``** (the key above Tab) or click **Terminal → New Terminal** in the top menu.
3. Check your Node.js version:
   ```bash
   node -v
   ```
   *(Make sure it says `v20.19+` or `v22.x.x`. If you don't have Node 22 installed, download the **LTS** installer from [https://nodejs.org](https://nodejs.org)).*
4. Install all project packages:
   ```bash
   npm install
   ```
5. Start the local server:
   ```bash
   npm run dev
   ```
6. You will see output in your terminal similar to:
   ```text
   VITE v8.x.x  ready in 400 ms

   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.42:3000/
   ```

---

### Step 3.2 — Verify on Desktop Web Browser
Open Chrome or Edge and visit **`http://localhost:3000`**:

1. **Verify Landing Page (`/`):**
   - Scroll down through the Hero section, click between **`Mind & ANS`**, **`Metabolic & Gut`**, and **`Musculoskeletal`** on the interactive Human Body diagram, and inspect the 4-Pillar Ecosystem cards.
2. **Click "Member & Coach Portal" (top right) to go to `/login`.**
3. **Test #1 — Live Google OAuth + `@hbplus.fit` Rejection Rule:**
   - Click **"Continue with Google"** and choose your personal `@gmail.com` Google account.
   - Google will authenticate you, redirect back to your app, and our domain security gate will detect `@gmail.com` ≠ `@hbplus.fit`, **immediately sign you out of Supabase**, and display the red alert banner:
     > *"Access restricted. Please login using your official domain email."*
   - This proves **both** Google OAuth AND `@hbplus.fit` domain enforcement are working live!
4. **Test #2 — Verify Real Database Row Creation in Supabase (60-Second Test):**
   - Want to see your real Google account create a row inside your Supabase `profiles` and `wellness_logs` tables?
   - In VS Code `.env`, temporarily change line 2 & 3 to `gmail.com`:
     ```env
     VITE_ALLOWED_DOMAIN=gmail.com
     EXPO_PUBLIC_ALLOWED_DOMAIN=gmail.com
     ```
   - In your VS Code terminal, press **`Ctrl + C`** to stop the server, then run `npm run dev` again (Vite reads `.env` on startup).
   - Now click **"Continue with Google"** with your `@gmail.com` account!
   - You will land inside **`/dashboard`**! Check off a workout set, log a meal (`+420 kcal`), or click a hydration glass.
   - Open **Supabase Dashboard → Table Editor → `profiles` and `wellness_logs`** — you will see your real Google account row and updated calories/hydration saved in PostgreSQL!
   - Click **Sign Out** in the app, change `.env` **back to `hbplus.fit`**, press `Ctrl + C`, and run `npm run dev` again so your strict `@hbplus.fit` rule is active!
5. **Test #3 — Verify the Recruiter Testing Sandbox:**
   - On `/login`, click the 3 buttons inside **Recruiter Testing Sandbox**:
     - **Login as Member (`member@hbplus.fit`)** → Test the 60s Rest Timer, Macro Rings, and 4-7-8 Breathwork Orb.
     - **Simulate Blocked User (`user@gmail.com`)** → Test instant rejection banner.
     - **Login as Coach / Admin (`admin@hbplus.fit`)** → Open an Athlete File (e.g., Alex Chen), click **Apply 10% Deload**, adjust Macro Sliders, and post a Coach Note.

---

### Step 3.3 — Verify Mobile Layout (2 Ways: Browser Simulator + Your Real Phone!)

#### Method A: Chrome Mobile Simulator (`360px` Phone & `768px` iPad)
1. With `http://localhost:3000` open in Chrome, press **`F12`** (or right-click anywhere → **Inspect**).
2. Click the **Toggle Device Toolbar** icon (looks like a little phone & tablet at the top-left of the Inspect panel, or press **`Ctrl + Shift + M`**).
3. At the top of the page, pick **iPhone SE / Galaxy S8+ (`360px`–`390px`)**:
   - Check the compact `"Portal →"` button + Hamburger Drawer (`☰`) on the Landing Page.
   - Check that there is **zero horizontal sideways scrolling**.
   - Log into the Member Dashboard and verify the `2x2` Metric Cards, wrapping Macro Rings, and centered Breathwork Orb.
4. Switch the device dropdown to **iPad Air (`820px`)** to verify the `2-column` tablet layout!

#### Method B: Test Directly on Your Real Smartphone (iOS or Android)!
Because `package.json` runs `vite --port=3000 --host=0.0.0.0`, your laptop broadcasts the app over your Wi-Fi!
1. Connect your **phone** and your **laptop** to the **exact same Wi-Fi network**.
2. Look at your VS Code terminal where `npm run dev` is running and find the **`Network:`** line, for example:
   `➜  Network: http://192.168.1.42:3000/` *(use the exact IP address shown in YOUR terminal).*
3. Open **Safari (iPhone)** or **Chrome (Android)** on your phone and type that exact `http://192.168.x.x:3000` address!
   *(Tip: On Windows, if your phone takes forever to load, a Windows Defender Firewall popup may have appeared behind VS Code—click **Allow access** on Private networks).*
4. Tap through the mobile drawer, Recruiter Sandbox, 60s workout rest timer, and 4-7-8 breathwork orb natively with your thumb!

---

## PART 4: Clean Folder Structure & Push to GitHub

### Step 4.1 — Clean Up Extra Files Before Pushing
Look at your VS Code Explorer sidebar on the left (`hbplus-app`):
1. **Delete unnecessary temporary/duplicate files** (right-click → Delete in VS Code if you want an ultra-clean repo):
   - Delete **`bun.lock`** *(you already have `package-lock.json` for `npm`; keeping two lockfiles confuses recruiters and CI servers).*
   - Optional: You can keep `firestore.rules`, `firebase-blueprint.json`, `security_spec.md`, and `SETUP_AND_DEPLOYMENT_GUIDE.md`, or remove `SETUP_AND_DEPLOYMENT_GUIDE.md` if you only want `README.md` visible on GitHub. **(Do NOT delete `firebase-applet-config.json` because `src/config/firebase.ts` imports it as a fallback module—`netlify.toml` is already configured to handle it cleanly!)**
2. **CRITICAL SECURITY CHECK — Verify `.gitignore` protects `.env`:**
   - Open `.gitignore` in VS Code and confirm it contains:
     ```gitignore
     node_modules/
     build/
     dist/
     coverage/
     .DS_Store
     *.log
     .env*
     !.env.example
     ```
   - Notice in your VS Code sidebar that `.env` and `node_modules` appear **grayed out / dimmed**—that means Git is ignoring them so your secret keys will NOT be uploaded!

---

### Step 4.2 — Test the Production Build Locally Before Pushing
In your VS Code terminal, press **`Ctrl + C`** to stop the dev server, then run:
```bash
npm run build
```
Confirm it finishes with **`✓ built in ...s`** and zero errors! (`dist/` will be created and ignored by Git automatically).

---

### Step 4.3 — Create a GitHub Repository & Push Your Code
1. Check if Git is installed by running in VS Code terminal:
   ```bash
   git --version
   ```
   *(If it says command not found, download and install Git from [https://git-scm.com/downloads](https://git-scm.com/downloads), restart VS Code, and set your name/email once:*
   `git config --global user.name "Your Name"`
   `git config --global user.email "your-email@gmail.com"` *).*
2. Open **[https://github.com/new](https://github.com/new)** in your browser (sign in or create a free GitHub account first):
   - **Repository name:** `hbplus-wellness-portal`
   - **Description:** `HB+ (hbplus.fit) Cross-Platform Health, Fitness & Mental Wellness Portal with Supabase Google OAuth & RBAC`
   - **Visibility:** Choose **Public** (recommended if sharing with a recruiter) or **Private**.
   - **IMPORTANT:** Leave *"Add a README file"*, *"Add .gitignore"*, and *"Choose a license"* **UNCHECKED** (your local project already has them!).
   - Click **Create repository**.
3. Copy the repository URL shown on the next screen (it looks like `https://github.com/YOUR_GITHUB_USERNAME/hbplus-wellness-portal.git`).
4. Run these exact commands one by one in your **VS Code Terminal**:

```bash
git init
```
```bash
git status
```
*(Quick check: look at the list printed by `git status` — confirm `.env` and `node_modules/` are **NOT** listed!)*

```bash
git add .
```
```bash
git commit -m "feat: complete HB+ responsive wellness platform with Supabase OAuth and RBAC"
```
```bash
git branch -M main
```
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/hbplus-wellness-portal.git
```
*(Replace the URL above with YOUR actual GitHub repository URL!)*

```bash
git push -u origin main
```
*(If a popup appears asking to **Sign in with your browser** to GitHub, click **Sign in with your browser** and authorize VS Code).*

5. Refresh your GitHub repository page in your browser — you will see your clean folder structure and your formatted `README.md` displayed right on the homepage!

---

## PART 5: Deploy to Netlify & Verify the Live Production URL

### Step 5.1 — Connect GitHub to Netlify
1. Go to **[https://app.netlify.com](https://app.netlify.com)** and click **Sign up** / **Log in** → choose **Continue with GitHub**.
2. Once inside your Netlify Dashboard, click **Add new project** (or **Add new site**) → click **Import an existing project**.
3. Click **GitHub** (authorize Netlify to see your repositories if prompted).
4. Click on your **`hbplus-wellness-portal`** repository.
5. Netlify will automatically read your `netlify.toml` file and pre-fill:
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. **DO NOT CLICK DEPLOY YET — Add Environment Variables First!**
   - Scroll down on that same page and click **Add environment variables** → **New variable** (add these 4 one by one, using the exact values from your `.env` file **without** quotes around the values):
     1. Key: `VITE_ALLOWED_DOMAIN` → Value: `hbplus.fit`
     2. Key: `EXPO_PUBLIC_ALLOWED_DOMAIN` → Value: `hbplus.fit`
     3. Key: `VITE_SUPABASE_URL` → Value: `https://YOUR_PROJECT_ID.supabase.co`
     4. Key: `VITE_SUPABASE_ANON_KEY` → Value: `eyJhbGciOiJIUzI1NiIs...` *(your anon public key)*
7. Now click **Deploy hbplus-wellness-portal**!
8. Wait **60–90 seconds** while Netlify builds your site. Once it says **Published**, Netlify gives you a live green URL (e.g., `https:// random-name-12345.netlify.app`).
   - *Pro Tip:* To make the URL look super clean for recruiters, click **Domain management** → **Options** (next to `.netlify.app`) → **Edit project name** → type `hbplus-wellness` (or `hbplus-fit-portal`) → **Save**! Now your URL is `https://hbplus-wellness.netlify.app`!

---

### Step 5.2 — CRITICAL FINAL STEP: Connect Your Live Netlify URL to Supabase & Google OAuth!
Right now, Supabase and Google still think your app lives at `http://localhost:3000`. If you click "Sign in with Google" on your Netlify site before doing this 60-second update, it would redirect you back to `localhost`! Let's update both:

1. **Copy your final live Netlify URL** (e.g. `https://hbplus-wellness.netlify.app` — with **no** `/` at the end).
2. **Update Supabase Redirect URLs:**
   - Open **Supabase Dashboard → Authentication → URL Configuration**.
   - Change **Site URL** to your live Netlify URL:
     `https://hbplus-wellness.netlify.app`
   - Under **Redirect URLs**, click **Add URL** and add:
     `https://hbplus-wellness.netlify.app/**`
     *(Keep `http://localhost:3000/**` in the list too so both local AND production work!)*
   - Click **Save changes**.
3. **Update Google Cloud Console Origins:**
   - Open **[Google Cloud Console → Clients / Credentials](https://console.cloud.google.com/apis/credentials)** and click on **`HB+ Supabase Web Client`**.
   - Under **Authorized JavaScript origins**, click **+ Add URI** and add your live Netlify URL:
     `https://hbplus-wellness.netlify.app`
     *(Leave **Authorized redirect URIs** pointing to `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback` — do NOT remove that!)*
   - Click **Save**.

---

### Step 5.3 — Final End-to-End Verification Checklist on Your Live URL!
Open your live **`https://hbplus-wellness.netlify.app`** link on **both your laptop (Incognito window)** and **your smartphone**:

- [ ] **1. Direct URL Refresh Test (SPA Routing):** Visit `https://hbplus-wellness.netlify.app/login` directly and hit browser Refresh (`F5`) — confirms `netlify.toml` serves the app cleanly with zero `404` errors!
- [ ] **2. All Photography & Avatars Load:** Scroll the Landing Page (`/`) and Coach Roster — confirms all 14 high-resolution bundled assets load crisply.
- [ ] **3. Live Google Sign-In + Domain Gate:** Click **"Continue with Google"** with a `@gmail.com` email — confirms Google OAuth redirects back to your live Netlify domain, signs out unauthorized domains, and displays *"Access restricted. Please login using your official domain email."*
- [ ] **4. Recruiter Demo Sandbox:** Test **Member**, **Blocked User**, and **Coach / Admin** flows on both Desktop and Mobile phone.
- [ ] **5. Update Live Link in `README.md`:** Open `README.md` in VS Code, replace `https://your-hbplus-site.netlify.app` on line 7 with your real Netlify URL, save, and push that 1-line update:
  ```bash
  git add README.md
  git commit -m "docs: add live Netlify production URL to README"
  git push
  ```
  *(Netlify will automatically redeploy in ~45 seconds whenever you run `git push`!)*

---

## Troubleshooting Cheat Sheet (Just in Case!)

| Symptom | Why It Happened | 30-Second Fix |
| :--- | :--- | :--- |
| **Google shows `Error 400: redirect_uri_mismatch`** | Typo or extra space in Google Cloud Console's **Authorized redirect URIs**. | Make sure Google Cloud's **Authorized redirect URI** is **exact**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback` (NOT `localhost` and NOT `netlify.app` — Google redirects to Supabase first, then Supabase redirects to your app!). |
| **After Google login on Netlify, it redirects me to `localhost:3000`** | Supabase **Site URL** is still `http://localhost:3000`. | Go to **Supabase → Authentication → URL Configuration**, set **Site URL** to `https://your-site.netlify.app`, and add `https://your-site.netlify.app/**` to **Redirect URLs**. |
| **Clicking Google Sign-In does nothing or uses popup instead of Supabase** | `.env` keys weren't loaded or had empty quotes `""`. | Check `.env` (locally) or **Netlify → Environment variables** (live). After changing Netlify env vars, click **Deploys → Trigger deploy → Deploy project** so Vite bakes the new `VITE_` variables into the build! |
| **Changes to `.env` in VS Code aren't taking effect** | Vite only reads `.env` when `npm run dev` starts. | Click into the VS Code terminal, press `Ctrl + C`, then run `npm run dev` again. |
