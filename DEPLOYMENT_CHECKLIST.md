# 🚀 M Group Cool ERP & CRM - Deployment Checklist

This document details the configuration, environmental setups, compilation routines, and validation guidelines to deploy the **M Group Cool** suite on any production system, such as Google Cloud Run, Vercel, or standard Node VPS environments.

---

## 📋 1. Pre-deployment Code Auditing & Verification
- [x] Run compilation linter check to ensure No TypeScript warnings exist:
  ```bash
  npm run lint
  ```
- [x] Bundle frontend code and backend Node entry point safely into optimized builds:
  ```bash
  npm run build
  ```
- [x] Verify Firebase configuration is included dynamically from `src/firebase-applet-config.json`.
- [x] Ensure no sensitive API keys for Gemini are hardcoded in source files. All secrets must be loaded dynamically via `process.env`.

---

## ☁️ 2. Environment Variables Configuration (متغيرات البيئة)
Configure the following continuous variables inside your hosting platform (Cloud Run console, Vercel settings, or `.env` system file):

| Variable Name | Type | Requirement | Usage Purpose |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Secret String | Highly Recommended | powers the `gemini-3.5-flash` model for intelligent HVAC reports & business analysis insights. |
| `NODE_ENV` | Configuration | Optional | Set to `production` on deployment servers to maximize memory cache efficiency and load compiled build assets directly. |

---

## 📦 3. Build & Bundling Architecture
The build command executes two concurrent stages for zero-vulnerability package execution:
1. `vite build`: Transpiles the fully reactive client-side layouts into compressed HTML, JS, and CSS static bundles placed in `/dist`.
2. `esbuild server.ts`: Compiles the server backend using Node platform bundling into a single target file, `/dist/server.cjs`.
   - **Lazy Import Optimization**: Dynamically requests ESM-only packages (like `vite` v6) only in `development` mode, avoiding any synchronous CommonJS startup failures in production.

---

## 🚢 4. Deployment Instructions

### Option A: Google Cloud Run (Recommended & Direct)
Since the suite operates on port `3000` via our high-speed node server, it is fully optimized for container deployment.
1. Build the Docker container command or allow Cloud Run to build it directly via Buildpacks using Node engine.
2. Ensure you map Port **3000** for container ingress.
3. Attach the `GEMINI_API_KEY` under the Cloud Run *Variables & Secrets* tab.
4. Scale CPU and Memory configurations. **512MB RAM & 1 vCPU** are perfectly adequate for fast response times.

### Option B: Firebase Hosting & Firestore Setup
1. Execute the deploy command inside Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```
   This synchronizes `firestore.rules` containing role-based authorization safety protocols directly into your active Firebase project.
2. Connect Firebase Hosting rewrite rules in `firebase.json` if configuring static routing.

### Option C: Vercel / Netlify Deployments
1. Connect the repository branch (e.g., `main`).
2. Map the Build command to: `npm run build`
3. Map the Output directory to: `dist`
4. Add `GEMINI_API_KEY` to the environment variables section in Vercel settings.

---

## 📈 5. Post-Deployment Verification Protocol
After building and scaling, verify these crucial checkpoints:
- **Server Health**: Query the server status by calling `https://<YOUR-SUITE-URL>/api/health`. It must respond with `{"status":"ok", "mode":"production"}`.
- **Database Resilience**: Open the main CRM screen and perform a sample Customer Creation. The app should perform reactive data saving with robust local persistence.
- **AI Analytics Core**: Query the Bilingual Voice AI Assistant (e.g. ask "الأرباح") to inspect correct Gemini API pipeline responses or smart rule-based local summaries.
