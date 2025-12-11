import { Language } from "./types";

export const UI_LABELS = {
  [Language.ENGLISH]: {
    welcome: "Healthcare Assistant",
    subtitle: "Voice-first symptom triage & support",
    start: "Start New Session",
    history: "History",
    recording: "Listening...",
    processing: "Thinking...",
    tapToSpeak: "Tap to Speak",
    typeMessage: "Type a message...",
    send: "Send",
    diagnosis: "Potential Diagnosis",
    confidence: "Confidence",
    recommendation: "Recommendation",
    selectLang: "Select Language",
    admin: "Admin Panel"
  },
  [Language.HINDI]: {
    welcome: "स्वास्थ्य सहायक",
    subtitle: "आवाज-प्रथम लक्षण जांच और सहायता",
    start: "नया सत्र शुरू करें",
    history: "इतिहास",
    recording: "सुन रहा हूँ...",
    processing: "सोच रहा हूँ...",
    tapToSpeak: "बोलने के लिए दबाएं",
    typeMessage: "संदेश लिखें...",
    send: "भेजें",
    diagnosis: "संभावित निदान",
    confidence: "आत्मविश्वास",
    recommendation: "सिफारिश",
    selectLang: "भाषा चुनें",
    admin: "एडमिन पैनल"
  },
  [Language.TAMIL]: {
    welcome: "சுகாதார உதவியாளர்",
    subtitle: "குரல் வழி அறிகுறி ஆய்வு மற்றும் ஆதரவு",
    start: "புதிய அமர்வைத் தொடங்கவும்",
    history: "வரலாறு",
    recording: "கேட்கிறது...",
    processing: "சிந்திக்கிறது...",
    tapToSpeak: "பேச தட்டவும்",
    typeMessage: "செய்தியை தட்டச்சு செய்க...",
    send: "அனுப்பு",
    diagnosis: "சாத்தியமான நோய்",
    confidence: "நம்பிக்கை",
    recommendation: "பரிந்துரை",
    selectLang: "மொழியைத் தேர்ந்தெடுக்கவும்",
    admin: "நிர்வாகக் குழு"
  }
};

export const MOCK_HISTORY: any[] = [
  {
    id: "session-001",
    date: "2023-10-27",
    preview: "Headache and fever..."
  },
  {
    id: "session-002",
    date: "2023-10-25",
    preview: "Skin rash on arm..."
  }
];
