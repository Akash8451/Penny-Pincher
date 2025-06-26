
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Sparkles, Lock, Mic, Send, Loader2, ExternalLink } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import { askAssistant } from '@/ai/flows/assistant-flow';
import type { Category, Expense, Person } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface AIAssistantProps {
    expenses: Expense[];
    categories: Category[];
    people: Person[];
    onLogExpense: (details: { amount: number; categoryId: string; note: string }) => void;
    isFullPage?: boolean;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function AIAssistant({ expenses, categories, people, onLogExpense, isFullPage = false }: AIAssistantProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hello! How can I help you today? You can ask me about your finances or tell me to log an expense." }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceResult = (transcript: string) => {
    setQuery(transcript);
    handleAsk(transcript);
  };
  
  const handleVoiceError = (error: string) => {
    let description = 'An unknown error occurred. Please try again.';
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      description = 'Microphone access denied. Please enable it in your browser settings.';
    } else if (error === 'no-speech') {
      description = 'No speech was detected. Please make sure your microphone is working.';
    } else if (error === 'network') {
      description = 'A network error occurred. Please check your connection and try again.';
    }
    toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
  };
  
  const { isListening, toggleListening } = useSpeechRecognition({ onResult: handleVoiceResult, onError: handleVoiceError });

  const handleAsk = async (currentQuery?: string) => {
    const queryToSubmit = (typeof currentQuery === 'string' ? currentQuery : query).trim();
    if (!queryToSubmit) return;

    setIsLoading(true);
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: queryToSubmit }]);

    try {
        const result = await askAssistant({ query: queryToSubmit, expenses, categories, people });
        
        if ('speechSynthesis' in window) {
            const spokenText = result.answer.replace(/[*_`~#]/g, ''); // Remove markdown for cleaner speech
            const utterance = new SpeechSynthesisUtterance(spokenText);
            speechSynthesis.speak(utterance);
        }
        
        setMessages(prev => [...prev, { role: 'ai', text: result.answer }]);

        if (result.action?.name === 'logExpense') {
            onLogExpense(result.action.parameters);
        }

    } catch (error) {
        console.error("AI Assistant Error:", error);
        const errorMessage = "There was a problem getting a response. Please try again.";
        setMessages(prev => [...prev, { role: 'ai', text: errorMessage }]);
        toast({ variant: 'destructive', title: 'AI Assistant Error', description: 'Could not get a response.'});
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className={cn(
        "h-full flex flex-col transition-all duration-300",
        !isFullPage && "bg-secondary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className='flex items-center gap-2 text-xl'>
                <Lock className='h-4 w-4 text-muted-foreground' />
                <Wand2 className='text-primary' />
                AI Assistant
            </CardTitle>
            {!isFullPage && (
                <Link href="/assistant" passHref>
                    <Button variant="ghost" size="icon" aria-label="Expand chat">
                        <ExternalLink className="h-5 w-5" />
                    </Button>
                </Link>
            )}
        </div>
        <CardDescription>Your voice-powered financial assistant. Your data is processed securely on-device.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow h-48 mb-4 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                {message.role === 'ai' && <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
                <div className={cn(
                  "p-3 rounded-lg max-w-sm prose prose-xs dark:prose-invert",
                  message.role === 'user' 
                    ? 'bg-primary/20' 
                    : 'bg-background/50'
                )}>
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(message.text) }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="p-3 rounded-lg bg-background/50">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form 
            onSubmit={(e) => { e.preventDefault(); handleAsk(); }} 
            className="flex w-full items-center gap-2"
        >
            {isListening ? (
                <Button
                    type="button"
                    variant="destructive"
                    onClick={toggleListening}
                    className="w-full animate-pulse"
                >
                    <Mic className="mr-2 h-4 w-4" /> Listening... Tap to stop
                </Button>
            ) : (
                <>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={toggleListening}
                        disabled={isLoading}
                    >
                        <Mic />
                        <span className="sr-only">Use Microphone</span>
                    </Button>
                    <Input 
                        placeholder='Ask a question or log an expense...'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
                        <Send />
                        <span className="sr-only">Submit</span>
                    </Button>
                </>
            )}
        </form>
      </CardFooter>
    </Card>
  );
}
