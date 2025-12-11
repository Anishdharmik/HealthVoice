export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
  TAMIL = 'ta'
}

export enum Sender {
  USER = 'USER',
  BOT = 'BOT'
}

export enum AppRoute {
  AUTH = 'auth',
  HOME = 'home',
  CHAT = 'chat',
  HISTORY = 'history',
  ADMIN = 'admin',
  DOCTOR_DASHBOARD = 'doctor_dashboard'
}

export interface DiseasePrediction {
  name: string;
  probability: number;
}

export interface Message {
  id: string;
  sessionId: string;
  sender: Sender;
  text: string; // The transcription or the response text
  timestamp: number;
  audioUrl?: string; // For TTS playback or User audio playback
  
  // Bot specific metadata
  metadata?: {
    intent?: string;
    detectedLanguage?: string;
    confidence?: number;
    symptomsExtracted?: string[];
    predictions?: DiseasePrediction[];
    diagnosis?: string;
    recommendedAction?: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  language: Language;
  createdAt: number;
  lastActiveAt: number;
  messages: Message[];
  extractedPatientName?: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Mock password
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  date: string; // ISO string
  timeSlot: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  symptomsSummary: string; // From AI triage
  notes?: string;
}

export interface ChatState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlayingAudio: boolean;
}