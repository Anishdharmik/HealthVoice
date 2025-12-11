import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, AppRoute, Session, Sender, Message, User } from './types';
import { UI_LABELS, MOCK_HISTORY } from './constants';
import { Button } from './components/Button';
import { AudioRecorder } from './components/AudioRecorder';
import { ChatBubble } from './components/ChatBubble';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { DoctorDashboard } from './components/DoctorDashboard';
import { processAudioInput } from './services/geminiService';
import { appointmentService } from './services/dataService';

const App = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.AUTH);
  
  // --- Patient/Session State ---
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [session, setSession] = useState<Session | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'booked'>('idle');
  
  // --- Chat State ---
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  useEffect(() => {
    // Check for "remember me" logic or just default to Auth
    // For now, if no user, ensure on Auth
    if (!currentUser) {
        setCurrentRoute(AppRoute.AUTH);
    }
  }, [currentUser]);

  // --- Helpers ---
  const getLabels = () => UI_LABELS[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  // --- Auth Actions ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'doctor') {
      setCurrentRoute(AppRoute.DOCTOR_DASHBOARD);
    } else if (user.role === 'admin') {
      setCurrentRoute(AppRoute.ADMIN);
    } else {
      setCurrentRoute(AppRoute.HOME);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSession(null);
    setCurrentRoute(AppRoute.AUTH);
  };

  // --- Patient Actions ---

  const startNewSession = () => {
    setBookingStatus('idle');
    
    const initialText = language === Language.ENGLISH ? "Hello, I am HealthVoice. Before we begin, may I please know your name?" 
             : language === Language.HINDI ? "नमस्ते, मैं HealthVoice हूँ। शुरू करने से पहले, क्या मैं आपका नाम जान सकता हूँ?"
             : "வணக்கம், நான் HealthVoice. நாம் தொடங்குவதற்கு முன், உங்கள் பெயரை நான் தெரிந்து கொள்ளலாமா?";

    const newSession: Session = {
      id: Date.now().toString(),
      userId: currentUser?.id || 'guest',
      language: language,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      messages: [{
        id: 'init',
        sessionId: 'new',
        sender: Sender.BOT,
        text: initialText,
        timestamp: Date.now()
      }]
    };
    setSession(newSession);
    setCurrentRoute(AppRoute.CHAT);
  };

  const speakText = useCallback((text: string, lang: Language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      [Language.ENGLISH]: 'en-US',
      [Language.HINDI]: 'hi-IN',
      [Language.TAMIL]: 'ta-IN'
    };
    utterance.lang = langMap[lang];
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleInput = async (audioBlob: Blob | null, text: string | null) => {
    if ((!audioBlob && !text) || !session) return;

    setIsProcessing(true);

    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      sessionId: session.id,
      sender: Sender.USER,
      text: text || "Audio Message...", 
      timestamp: Date.now(),
    };

    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

    try {
      const result = await processAudioInput(audioBlob, text, language, session.messages);

      if (audioBlob) {
        setSession(prev => {
          if (!prev) return null;
          const updatedMessages = prev.messages.map(m => 
            m.id === userMsgId ? { ...m, text: result.transcription } : m
          );
          return { ...prev, messages: updatedMessages };
        });
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sessionId: session.id,
        sender: Sender.BOT,
        text: result.responseText,
        timestamp: Date.now(),
        metadata: {
          symptomsExtracted: result.symptoms,
          diagnosis: result.diagnosis,
          confidence: result.confidence,
          recommendedAction: result.recommendedAction,
          detectedLanguage: result.detectedLanguage
        }
      };

      // Update session with new bot message AND detected patient name if found
      setSession(prev => prev ? {
        ...prev,
        extractedPatientName: result.patientName || prev.extractedPatientName,
        messages: [...prev.messages, botMessage]
      } : null);

      speakText(result.responseText, language);

    } catch (error) {
      console.error("Processing failed", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        sessionId: session.id,
        sender: Sender.BOT,
        text: "Sorry, something went wrong. Please try again.",
        timestamp: Date.now()
      };
      setSession(prev => prev ? { ...prev, messages: [...prev.messages, errorMessage] } : null);
    } finally {
      setIsProcessing(false);
      setInputText("");
    }
  };

  const handleBookAppointment = async () => {
      if (!session || !currentUser) return;
      setBookingStatus('booking');

      // 1. Try to get symptoms from AI Metadata
      let symptoms = session.messages
        .filter(m => m.sender === Sender.BOT && m.metadata?.symptomsExtracted)
        .flatMap(m => m.metadata?.symptomsExtracted || [])
        .join(', ');

      // 2. Fallback: If AI didn't tag symptoms formally, take the user's text messages (excluding short inputs like "Yes/No" or Names)
      if (!symptoms) {
         const userMessages = session.messages
            .filter(m => m.sender === Sender.USER && m.text.length > 3 && !m.text.includes(session.extractedPatientName || "xyz"))
            .map(m => m.text)
            .join('. ');
         symptoms = userMessages || "Patient requested consultation (No specific symptoms logged).";
      }

      // Use the name detected by AI if available, otherwise fall back to the account name
      const patientName = session.extractedPatientName || currentUser.name;

      console.log(`Booking for: ${patientName}, Symptoms: ${symptoms}`); // Debug log

      await appointmentService.createAppointment(currentUser.id, patientName, symptoms);
      setBookingStatus('booked');
  };

  // --- Views ---

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 animate-fade-in">
       {/* User Profile Snippet */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-800">{currentUser?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{currentUser?.role}</div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-sm">Logout</Button>
      </div>

      <div className="text-center space-y-2">
        <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
           <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{getLabels().welcome}</h1>
        <p className="text-lg text-slate-500">{getLabels().subtitle}</p>
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-3">{getLabels().selectLang}</label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.values(Language).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all ${
                language === lang 
                  ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-300 ring-offset-1' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang === Language.ENGLISH ? 'English' : lang === Language.HINDI ? 'हिंदी' : 'தமிழ்'}
            </button>
          ))}
        </div>

        <Button onClick={startNewSession} className="w-full py-4 text-lg shadow-lg">
          {getLabels().start}
        </Button>
      </div>
      
      <div className="flex gap-4">
        <button onClick={() => setCurrentRoute(AppRoute.HISTORY)} className="text-sm text-slate-500 hover:text-teal-600 underline">{getLabels().history}</button>
        {currentUser?.role === 'admin' && (
            <button onClick={() => setCurrentRoute(AppRoute.ADMIN)} className="text-sm text-slate-500 hover:text-teal-600 underline">{getLabels().admin}</button>
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
        <button onClick={() => setCurrentRoute(AppRoute.HOME)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
            <h2 className="font-semibold text-slate-800">HealthVoice AI</h2>
            <span className="text-xs text-teal-600 font-medium uppercase tracking-wider">{language} Session</span>
        </div>
        <div className="w-8"></div> {/* Spacer */}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-6 pb-24">
            {session?.messages.map((msg) => (
               <ChatBubble key={msg.id} message={msg} labels={getLabels()} />
            ))}
            {isProcessing && (
              <div className="flex justify-start animate-pulse">
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm text-sm text-gray-500 border border-gray-100">
                    {getLabels().processing}
                 </div>
              </div>
            )}
            
            {/* Booking CTA logic: Show button if we have symptoms extracted or it's a long conversation */}
            {session?.messages.length! > 2 && bookingStatus === 'idle' && (
                <div className="flex justify-center mt-6">
                    <Button onClick={handleBookAppointment} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        Send to Doctor for Consultation
                    </Button>
                </div>
            )}
             {bookingStatus === 'booking' && (
                <div className="flex justify-center mt-6 text-sm text-slate-500 animate-pulse">
                    Updating doctor's dashboard...
                </div>
            )}
             {bookingStatus === 'booked' && (
                <div className="flex justify-center mt-6">
                    <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-lg flex items-center gap-2">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         Sent to Doctor successfully!
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6">
        <div className="flex flex-col gap-4">
           {/* Audio Control */}
           <div className="flex justify-center -mt-16">
              <AudioRecorder 
                onRecordingComplete={(blob) => handleInput(blob, null)} 
                disabled={isProcessing}
                isProcessing={isProcessing}
                labels={{ recording: getLabels().recording, tapToSpeak: getLabels().tapToSpeak }}
              />
           </div>

           {/* Text Fallback */}
           <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleInput(null, inputText)}
                placeholder={getLabels().typeMessage}
                disabled={isProcessing}
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-teal-500 focus:ring-0 rounded-full px-5 py-3 text-sm transition-all"
              />
              <button 
                onClick={() => handleInput(null, inputText)}
                disabled={!inputText.trim() || isProcessing}
                className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  // --- Render ---

  if (currentRoute === AppRoute.AUTH) {
      return <Auth onLogin={handleLogin} />;
  }

  if (currentRoute === AppRoute.DOCTOR_DASHBOARD && currentUser) {
      return <DoctorDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-100">
        {currentRoute === AppRoute.HOME && renderLanding()}
        {currentRoute === AppRoute.CHAT && renderChat()}
        {currentRoute === AppRoute.HISTORY && (
            <div className="max-w-2xl mx-auto p-6 min-h-screen">
                <div className="flex items-center mb-8">
                    <button onClick={() => setCurrentRoute(AppRoute.HOME)} className="mr-4 p-2 bg-white rounded-full shadow-sm hover:shadow text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">{getLabels().history}</h1>
                </div>
                <div className="space-y-4">
                    {MOCK_HISTORY.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold text-teal-700">{item.id}</span>
                                <span className="text-xs text-slate-400">{item.date}</span>
                            </div>
                            <p className="text-slate-600 text-sm">{item.preview}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {currentRoute === AppRoute.ADMIN && <Dashboard onBack={() => setCurrentRoute(AppRoute.HOME)} />}
    </div>
  );
};

export default App;