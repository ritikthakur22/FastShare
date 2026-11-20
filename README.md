<div align="center">
  <img src="public/icons/favicon.svg" width="128" height="128" alt="FastShare Logo" />

  # 🚀 FastShare Web 2.0
  **Ultra-fast, private, cross-platform file, text, and clipboard sharing over WebRTC.**

  [![Website](https://img.shields.io/badge/Website-fastshare.ritikthakur.com.np-519E8A?style=for-the-badge)](https://fastshare.ritikthakur.com.np)
  [![Google Play](https://img.shields.io/badge/Google_Play-FastShare-34A853?style=for-the-badge&logo=googleplay&logoColor=white)](https://play.google.com/store/apps/details?id=com.crdy.fastshare)
  [![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)](LICENSE)
  [![Android Client](https://img.shields.io/badge/Android_App-fastshare__app-blue?style=for-the-badge&logo=android&logoColor=white)](https://github.com/ritikthakur22/fastshare_app)
</div>

<div align="center">
  <h2>🌟 Introducing FastShare Pro</h2>
  <img src="pro.png" alt="FastShare Pro" width="100%" />
</div>

---

FastShare is a peer-to-peer file, text, and clipboard sharing platform. It enables instant, encrypted transfers directly between devices without cloud storage, file size limits, or user accounts. 

FastShare Web 2.0 is a modern client built to deliver the design, responsiveness, and performance of the official native mobile application directly in any browser.

## 🌟 Live Web App

Access the official web application at: **[https://fastshare.ritikthakur.com.np](https://fastshare.ritikthakur.com.np)**

## 📱 Official Mobile Application

FastShare is available as an official native Android app on the **Google Play Store**:

<div align="center">
  <a href="https://play.google.com/store/apps/details?id=com.crdy.fastshare">
    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="70" />
  </a>
</div>

- **Google Play Store Listing:** [FastShare on Google Play](https://play.google.com/store/apps/details?id=com.crdy.fastshare)
- **Application ID:** `com.crdy.fastshare`
- **Companion Mobile Client Repository:** [ritikthakur22/fastshare_app](https://github.com/ritikthakur22/fastshare_app)
- **Direct APK Releases:** [Latest APK Releases](https://github.com/ritikthakur22/fastshare_app/releases/latest)

## 🏗️ Architecture & Deployment

FastShare utilizes a split deployment architecture designed for speed and reliability:

- **Frontend Client (Vercel):** Modern Preact + TypeScript Single Page Application (SPA), bundled with Vite. Deployed on [Vercel](https://vercel.com) Edge Network with zero-bundle bloat (under 40 kB gzip) and strict Content Security Policy (CSP).
- **Backend Signaling Server (Render):** Lightweight Node.js WebSocket service hosted on [Render](https://render.com). Coordinates WebRTC ICE candidate exchange and discovery. Once peers establish a WebRTC data channel, all payloads stream device-to-device with end-to-end encryption. The server never inspects or touches files.

<div align="center">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</div>

## 🚀 Key Features

- **Direct WebRTC P2P Transfers:** Files stream directly peer-to-peer at full LAN or Wi-Fi speeds without intermediate hops.
- **Native App Design Alignment:** Features concentric radar scanning pulses, 360-degree laser sweep, dark and light themes, and responsive layout for mobile and desktop.
- **Network Awareness:** Clear Wi-Fi vs Public Internet badges on nearby peers.
- **System Audio & Notifications:** Integrated browser Web Notifications and synthesized Web Audio chimes for sent, received, and incoming transfers.
- **Multi-Device Pairing & Rooms:** Connect across networks using 6-digit pair keys or temporary 5-letter public rooms.
- **Clipboard & Text Sharing:** Share text snippets, URLs, and clipboard data instantly.
- **Privacy & Security First:** Zero analytics, zero trackers, no cookies, and no database retention. Files are kept in volatile memory and never persisted remotely.

## 📦 Tech Stack

- **Client:** Preact, TypeScript, Vite, WebRTC (`RTCDataChannel`), Web Audio API, Web Notifications API.
- **Signaling Server:** Node.js, Express, `ws` (WebSockets), `ua-parser-js`, `unique-names-generator`.

## 🛠 Local Setup & Development

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/ritikthakur22/FastShare.git

# Enter project directory
cd FastShare

# Install dependencies
npm install
```

### Running Locally
```bash
# Start frontend client in development mode (Vite)
npm run dev

# Build production bundle (outputs to dist/ and mirrors to frontend/)
npm run build

# Run automated tests
npm test

# Run backend signaling server
npm start
```

## 🌐 Custom Signaling Server (Self-Hosting)

FastShare connects by default to the official signaling server on Render (`wss://fastshare-ja1a.onrender.com/server`).

For local-only networks, corporate intranets, or air-gapped environments:
1. Start the signaling server on your local machine:
   ```bash
   npm start
   ```
2. Open FastShare on your browser, navigate to **Settings > Advanced**, and update the **Signaling Server URL** to your local address (e.g., `ws://192.168.1.100:3000`).

## 📄 Proprietary License & Terms of Use

**Copyright © 2026 Ritik Thakur. All rights reserved.**

This software and its source code are proprietary. Use, reproduction, copying, distribution, modification, public display, or decompilation of any part of this software without prior written authorization from the copyright holder is strictly prohibited.

- **No Unauthorized Distribution:** You may NOT publish, republish, distribute, upload, or make available this software, or any derivative works or builds, on the **Google Play Store**, Apple App Store, or any app marketplace or website without explicit written authorization from Ritik Thakur.
- **No Commercial Exploitation:** Commercial use, licensing, reselling, or monetization without authorization is prohibited.
- For permission requests or commercial inquiries, contact [Ritik Thakur](https://www.ritikthakur.com.np).
