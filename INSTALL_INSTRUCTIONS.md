# Studio A7 Wolf Bot - Digital Deployment & Embed Guide

This official guide provides a step-by-step walkthrough to deploy and host the **Studio A7 Wolf Bot Multiplayer Game** on your agency website, landing pages, or portals. By using modern cloud infrastructure, you can run and maintain this high-performance, real-time multiplayer application **for free** or at a fraction of a cent.

---

## 🚀 Architecture Overview

This game is a full-stack real-time application using:
1. **Frontend**: Vite + React 19 + Tailwind CSS + React-Three-Fiber (3D WebGL Engine).
2. **Backend**: Node.js + Express + Socket.io (WebSocket handling cluster).
3. **Data Sync**: Real-time server-authoritative state ticking at **60Hz** for fast player response and collision predictability.

Because this game relies on persistent WebSocket connections for multiplayer matchmaking, it must be hosted on a cloud runner supporting **active Node.js long-lived connections** (unlike serverless static hosters such as standard Vercel/Netlify, which terminate server runs after 10-30 seconds).

---

## 🛠️ Step 1: Free & Low-Cost Cloud Providers

We recommend the following leading Docker/Node.js hosters that offer permanent free configurations or introductory credits with extreme ease-of-use:

### A. Zeabur (Recommended & Simplest)
Zeabur compiles and runs standard full-stack Node.js projects out-of-the-box, managing port binding and WebSocket proxies automatically.
1. Sign up on **[Zeabur](https://zeabur.com/)** using your GitHub account.
2. Select **Create Project** and click **Deploy Service**.
3. Choose **GitHub** and authorize access to your repository (or upload a ZIP archive of this project directory).
4. Zeabur automatically scans your `package.json` file, provisions an Express target runner, and maps the internal port `3000` to a public web address (e.g. `https://studio-a7-snake.zeabur.app`).
5. Under service settings, configure any desired secrets (like `GEMINI_API_KEY` for auxiliary AI systems).

### B. Render.com (Highly Stable Free Tier)
Render offers native support for long-running Web Service workloads for free.
1. Create a free account at **[Render](https://render.com/)** and link your GitHub repository.
2. Click **New +** and select **Web Service**.
3. Point to your repository, and set the following parameters:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start` (or `node dist/server.cjs`)
4. Add the environment variable `NODE_ENV=production`.
5. Render exposes a randomized HTTPS domain (e.g. `https://studio-a7-wolfbot.onrender.com`), enabling reliable secure WebSockets (`wss://`).

### C. Railway.app (Professional Developer Sandbox)
Railway is fantastic for container projects. It charges purely for active CPU/Memory usage and provides starter grants.
1. Deploy the linked repository by connecting GitHub to **[Railway](https://railway.app/)**.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Under variable settings, set the port to `PORT=3000` (which is standard). Rail will automatically verify and expose your live web target.

---

## 🧱 Step 2: Embedding the Game into your Website

Once your cloud service is live and you have your deployment URL (e.g., `https://a7-wolfbot.yourhost.com`), you can embed it into any website (WordPress, Webflow, React, HTML5, Wix, Shopify, etc.) using a responsive HTML `<iframe>`.

### 💻 Standard Embed Snippet
Copy and paste this HTML block directly into your page's custom code editor or raw HTML container. It's configured to handle mobile touch inputs, mouse control locks, and fullscreen toggles beautifully:

```html
<div class="a7-game-container" style="position: relative; width: 100%; max-width: 1200px; height: 650px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <iframe 
        src="https://YOUR_DEPLOYED_URL_HERE" 
        style="width: 100%; height: 100%; border: none;" 
        allow="autoplay; fullscreen; pointer-lock;" 
        referrerpolicy="no-referrer">
    </iframe>
</div>
```

### 📱 Responsive Adaptations
For a full-screen, immersive application section (e.g., a specific desktop dashboard view), use a viewport-based CSS configuration:

```html
<iframe 
    src="https://YOUR_DEPLOYED_URL_HERE" 
    style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; z-index: 9999;" 
    allow="autoplay; fullscreen; pointer-lock;"
    referrerpolicy="no-referrer">
</iframe>
```

---

## 📈 Step 3: SEO Agency Optimizations for Studio A7

Because this is hosted on your domain, we can exploit this interactive asset to improve your agency's organic core vitals and rankings:
1. **Increase User Time-on-Site (Dwell Time)**: Interactive 3D multiplayer games are a goldmine for retaining users! A typical visitor dwelling on your site for 5+ minutes playing games signals high relevance to Google's ranking algorithms.
2. **Build Authority with Backlinks**: Allow developers and clients to embed your game on *their* blogs with a tiny credits line link back to your SEO services. Use the following footer setup:
   ```html
   <p style="text-align: center; font-size: 11px; font-family: sans-serif; color: #6b7280; margin-top: 8px;">
       Multiplayer Engine provided by 
       <a href="https://studio-a7.com" target="_blank" style="color: #60a5fa; text-decoration: underline;">Studio A7 SEO Agency</a>.
   </p>
   ```

---

*This guide was generated for the **Studio A7 Developer Team** to enable robust, lightweight cloud scaling.*
