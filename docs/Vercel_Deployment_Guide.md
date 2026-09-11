# 🚀 Step-by-Step Vercel Deployment Guide for TaxBuddy

This guide details how to deploy the **TaxBuddy Full-Stack Application** to **Vercel** (`https://vercel.com/`) in 1 minute.

---

## 📋 Prerequisites

1. A free **Vercel Account**: Sign up at [`https://vercel.com/`](https://vercel.com/).
2. **Git / GitHub Repository** OR **Vercel CLI**.

---

## ⚡ Option 1: Deploy via GitHub (Recommended - 1 Click)

1. Push this project code (`C:\Users\HI\.gemini\antigravity-ide\scratch\taxbuddy-clone`) to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "TaxBuddy Enterprise Full-Stack Release"
   git remote add origin https://github.com/YOUR_USERNAME/taxbuddy-clone.git
   git push -u origin main
   ```
2. Log in to [`https://vercel.com/dashboard`](https://vercel.com/dashboard).
3. Click **"Add New..."** -> **"Project"**.
4. Import your `taxbuddy-clone` GitHub repository.
5. In **Framework Preset**, select **Other** (Vercel will auto-detect `vercel.json`).
6. *(Optional)* Add **Environment Variables**:
   - `ITD_MODE` = `SANDBOX` or `PRODUCTION`
   - `ITD_ERI_CLIENT_ID` = `Your_Official_ITD_Client_ID`
   - `ITD_ERI_CLIENT_SECRET` = `Your_Official_ITD_Client_Secret`
7. Click **"Deploy"**!

🎉 Your app will be live instantly on a Vercel domain like `https://taxbuddy-clone.vercel.app`!

---

## 💻 Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Open terminal in the project directory:
   ```bash
   cd C:\Users\HI\.gemini\antigravity-ide\scratch\taxbuddy-clone
   ```
3. Run the deployment command:
   ```bash
   vercel
   ```
4. Follow the prompt defaults (Set root directory to `./`).
5. For production deployment, run:
   ```bash
   vercel --prod
   ```

---

## 🛠️ Vercel Architecture Features Included

- **Serverless Rewrites (`vercel.json`)**: All API routes (`/api/*`) and pages are routed automatically through Vercel serverless functions.
- **Writable `/tmp` Storage Fallback**: JSON databases auto-fallback to `/tmp` in serverless function invocations without disk permission errors.
- **Static Asset Caching**: `public/` assets (CSS, JS, images) are served via Vercel's global CDN edge network for ultra-fast performance.
