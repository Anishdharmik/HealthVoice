# HealthVoice AI - Multilingual Healthcare Assistant

HealthVoice AI is a voice-first, multilingual healthcare triage application designed to bridge the gap between patients and medical care. It features an AI-powered patient chatbot for symptom gathering and a comprehensive Kanban-style dashboard for doctors to manage patient flow.



## 🚀 Features

### For Patients (Voice Chatbot)
- **Voice-First Interface:** Speak naturally to describe symptoms; the AI transcribes and understands context.
- **Multilingual Support:** Full support for **English**, **Hindi**, and **Tamil** (Speech-to-Text & Text-to-Speech).
- **AI Triage:** Powered by **Google Gemini 2.5 Flash** to extract patient names, symptoms, and provide preliminary triage advice.
- **Smart Booking:** Automatically summarizes symptoms and books appointments with doctors.

### For Doctors (Dashboard)
- **Kanban Workflow:** Visual management of patient flow (Waiting → In Consultation → Completed).
- **Real-time Queue:** "Call Next Patient" feature to efficiently move patients through the queue.
- **Patient Records:** Searchable history of all patient interactions and consultations.
- **Clinical Notes:** Dedicated interface for recording diagnoses and prescriptions during consultation.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **AI & NLP:** Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK
- **Speech Services:** Web Speech API (Synthesis) & MediaRecorder API
- **State Management:** React Hooks & Context
- **Icons:** Heroicons (SVG)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/healthvoice-ai.git
   cd healthvoice-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Google Gemini API Key:
   ```env
   # Get your key from https://aistudio.google.com/
   API_KEY=your_google_gemini_api_key_here
   ```

   *Note: In this demo architecture, the API key is used client-side. For production, ensure proxy requests through a backend server.*

4. **Run the Application**
   ```bash
   npm start
   ```

## 🖥️ Usage Guide

### 1. Patient Flow
1. **Login:** Use the demo credentials `patient@demo.com` / `123`.
2. **Select Language:** Choose English, Hindi, or Tamil.
3. **Start Session:** Click the microphone icon and speak: *"My name is John and I have a severe headache."*
4. **AI Response:** The AI will extract your name/symptoms and respond via voice.
5. **Book:** Click "Send to Doctor" to queue your case.

### 2. Doctor Flow
1. **Login:** Use the demo credentials `doctor@demo.com` / `123`.
2. **Dashboard:** View the **Waiting** list.
3. **Consult:** Click **Call Next Patient** or select a patient card to open the consultation view.
4. **Treat:** Review AI-extracted symptoms, add clinical notes, and click **Complete Visit**.
5. **Records:** Switch to the **Records** tab to search past patient history.

## 📂 Project Structure

```
src/
├── components/        # UI Components
│   ├── AudioRecorder.tsx  # Mic handling & Visualizer
│   ├── ChatBubble.tsx     # Message display
│   ├── DoctorDashboard.tsx # Doctor's main interface
│   └── ...
├── services/
│   ├── geminiService.ts   # AI Prompt Engineering & API calls
│   └── dataService.ts     # Mock DB & Auth logic
├── types.ts           # TypeScript interfaces
├── constants.ts       # Multilingual strings & Config
└── App.tsx            # Main Routing & Layout
```

## 🔒 Privacy & Permissions

- **Microphone:** The app requires microphone access to function. Audio is processed transiently for transcription.
- **Data:** This is a demo application using local storage mock data. No real PHI (Protected Health Information) is stored permanently.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any features or bug fixes.

## 📄 License

This project is licensed under the MIT License.