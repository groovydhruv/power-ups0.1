# Power-Ups Learning Platform 🚀💎✨

A modern, gamified learning platform featuring **Navi**, an AI-powered Socratic teacher. This project offers a seamless experience across web and mobile (iOS/Android) using React Native and Expo.

## 🌟 Key Features

### 🎙️ Voice Walkie-Talkie with Navi
*   **Real-time AI Conversations**: Engage in natural, low-latency voice discussions with Navi.
*   **Socratic Teaching**: Navi guides learners through questions, encouraging deep understanding instead of rote memorization.
*   **Cloud Audio Persistence**: All voice messages are stored in Supabase storage for persistent history and instant replay.
*   **Smart Greetings**: Navi intelligently greets you only on your first visit to a resource.

### 🎮 Gamification System
*   **XP & Leveling**: Earn XP for completing resources and engaging in conversations.
*   **Streak Tracking**: Maintain your learning momentum with daily streak tracking.
*   **Progress Persistence**: Your stats, progress, and conversation history are securely stored in Supabase.

### 📺 Integrated Learning Content
*   **Resource Management**: Topics are broken down into curated resources (Videos, Articles, etc.).
*   **In-App Video Player**: Watch educational videos directly within the app without external redirects.
*   **Unlockable Content**: Sequential learning path ensures foundational topics are mastered first.

## 🛠️ Technical Stack

*   **Frontend**: React Native (Expo)
*   **Web Support**: Expo Web / Vite
*   **Database & Storage**: Supabase (PostgreSQL, Storage Buckets)
*   **Voice Engine**: Gemini 3 Flash (via Backend Proxy)
*   **Audio Handling**: 
    *   **Mobile**: `expo-av`, `expo-file-system`
    *   **Web**: Web Audio API, MediaRecorder
*   **Styling**: Custom theme-based design system

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   Expo Go app (for mobile testing)
*   A running [Voice Backend Proxy](https://github.com/your-username/voice-backend)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/power-ups0.1.git
    cd power-ups0.1
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory and add your Supabase and Backend details:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_KEY=your_supabase_anon_key
    VITE_VOICE_BACKEND_URL=http://localhost:8000
    ```

4.  **Database Setup**:
    Run the SQL scripts provided in `supabase-schema.sql` and `populate-powerup-metadata.sql` within your Supabase SQL editor. Ensure the `powerups` schema is exposed in your project settings.

### Running the App

*   **Web**: `npm run web`
*   **iOS/Android (Expo Go)**: `npm start` (then scan the QR code)

## 🌍 Deployment

### Web (GitHub Pages)
The project is configured for easy deployment to GitHub Pages:
1.  Update the `homepage` field in `package.json` with your URL.
2.  Run the deployment script:
    ```bash
    npm run deploy
    ```

## 🛡️ Security & Privacy
*   **Keys**: Sensitive API keys are managed server-side and never exposed to the client.
*   **Permissions**: Microphone access is requested only when starting a voice conversation.
*   **Data**: All user progress is isolated and protected via Supabase Row Level Security (RLS).

## 📄 License
This project is private and for internal use.

---

**Developed with ❤️ by the Power-Ups Team.**
