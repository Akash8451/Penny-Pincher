
'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SpeechRecognitionAPI {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  startListening: (onResult: (transcript: string) => void) => void;
  stopListening: () => void;
  speak: (text: string, onEnd?: () => void) => void;
  cancelSpeech: () => void;
}

const SpeechContext = createContext<SpeechRecognitionAPI | undefined>(undefined);

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};

export const SpeechProvider = ({ children }: { children: ReactNode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef<(transcript: string) => void>((_) => {});
  const onSpeechEndRef = useRef<(() => void) | undefined>(undefined);

  const { toast } = useToast();

  useEffect(() => {
    const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && ('speechSynthesis' in window);
    setIsSupported(supported);

    if (!supported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event) => {
      setIsListening(false);
      let description = 'An unknown error occurred.';
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        description = 'Microphone access denied. Please enable it in your browser settings.';
      } else if (event.error === 'no-speech') {
        description = 'No speech was detected. Please make sure your microphone is working.';
      } else if (event.error === 'network') {
        description = 'A network error occurred. Please check your connection.';
      }
      toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (onResultRef.current) {
        onResultRef.current(transcript);
      }
    };

    recognitionRef.current = recognition;
    
    const handleUtteranceEnd = () => {
        setIsSpeaking(false);
        if (onSpeechEndRef.current) {
            onSpeechEndRef.current();
        }
    };

    const utterance = new SpeechSynthesisUtterance();
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = handleUtteranceEnd;
    utterance.onerror = () => setIsSpeaking(false);
    
    // We don't assign it to anything, just configure the events
    window.speechSynthesis.onvoiceschanged = () => {};


    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, [toast]);

  const startListening = useCallback((onResult: (transcript: string) => void) => {
    if (!recognitionRef.current || !isSupported) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    onResultRef.current = onResult;
    recognitionRef.current.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [isSupported]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!isSupported) return;
    
    if (isListening) {
      stopListening();
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    onSpeechEndRef.current = onEnd;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        if(onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [isListening, stopListening, isSupported]);
  
  const cancelSpeech = useCallback(() => {
    if(!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const value = {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
};
