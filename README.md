# FOCUS ORCHESTRATOR
SYSTEMS ONLINE // BRUTALIST OS WORKFLOW ORCHESTRATOR

Focus Orchestrator is a high-performance desktop utility built with **Tauri v2**, **Next.js**, and **Rust**. It allows you to declare a work intent (e.g., "Prepare for trading session" or "Deep work on code") and orchestrates your OS workspace by launching the exact set of applications and URLs you need.

## 💀 BRUTALIST FEATURES

- **ARSENAL MANAGEMENT**:
  - **Auto-Scanned Apps**: Automatically crawls your Windows registry to find installed applications.
  - **Custom Tools**: Add your own `.exe` paths or URLs directly to your personal arsenal.
  - **Persistent Storage**: Custom tools are saved to local storage and persist between sessions.
- **AI-POWERED INTENT**:
  - Leverages **Gemini 2.0 Flash** to analyze your intent and select the optimal tools.
  - **Spatial Orchestration**: Suggets window placements (Left, Right, Maximized) for a perfect tiling layout.
- **BULLETPROOF LAUNCH**:
  - Custom Rust backend for direct binary execution.
  - Environment variable expansion (e.g., `%LOCALAPPDATA%`).
  - Graceful fallback to Windows `cmd` for stubborn applications.
- **BRUTALIST UI**: High-contrast, monospace terminal aesthetic designed for maximum focus.

## 🛠️ INSTALLATION

### 1. Prerequisites
Ensure you have the following installed on your Windows system:
- **Rust**: [rustup.rs](https://rustup.rs/)
- **Node.js**: v18+ (LTS recommended)
- **Tauri Prerequisites**: Follow the [Windows Setup Guide](https://v2.tauri.app/start/prerequisites/#windows) (C++ Build Tools, etc.).

### 2. Clone the Repository
```bash
git clone https://github.com/DivineDB/focus-orchestrator.git
cd focus-orchestrator
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🚀 DEVELOPMENT

To run the application in development mode with hot-reloading:
```bash
npm run tauri dev
```

## 📦 BUILD

To generate a production-ready Windows executable:
```bash
npm run tauri build
```
The resultinginstaller will be located in `src-tauri/target/release/bundle/msi/`.

## 📜 STACK
- **Frontend**: Next.js 15+, TypeScript, Vanilla CSS.
- **Backend**: Rust, Tauri v2.
- **AI**: Google Generative AI (Gemini).
- **Design**: Brutalist Monospace.

---
*Stay focused. Execute.*
