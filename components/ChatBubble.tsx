import React from 'react';
import { Message, Sender, Language } from '../types';

interface ChatBubbleProps {
  message: Message;
  labels: any;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, labels }) => {
  const isUser = message.sender === Sender.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in-up`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
        isUser 
          ? 'bg-teal-600 text-white rounded-br-none' 
          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
      }`}>
        {/* Main Text */}
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>

        {/* Diagnosis Card (Bot Only) */}
        {!isUser && message.metadata && message.metadata.diagnosis && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{labels.diagnosis}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                (message.metadata.confidence || 0) > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {message.metadata.confidence}% {labels.confidence}
              </span>
            </div>
            <p className="font-semibold text-teal-800">{message.metadata.diagnosis}</p>
            
            {message.metadata.recommendedAction && (
              <div className="mt-2 bg-slate-50 p-2 rounded text-sm text-slate-600">
                <span className="font-bold">{labels.recommendation}:</span> {message.metadata.recommendedAction}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] mt-2 text-right ${isUser ? 'text-teal-200' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};