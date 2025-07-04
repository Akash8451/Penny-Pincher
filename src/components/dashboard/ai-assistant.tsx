
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
import { useSpeech } from '@/contexts/speech-context';

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
  
  const { isListening, startListening, stopListening, speak, cancelSpeech } = useSpeech();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When component unmounts, cancel any ongoing speech
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const handleVoiceResult = (transcript: string) => {
    setQuery(transcript);
    handleAsk(transcript);
  };
  
  const handleAsk = async (currentQuery?: string) => {
    const queryToSubmit = (typeof currentQuery === 'string' ? currentQuery : query).trim();
    if (!queryToSubmit) return;

    setIsLoading(true);
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: queryToSubmit }]);

    try {
        const result = await askAssistant({ query: queryToSubmit, expenses, categories, people });
        
        const spokenText = result.answer.replace(/[*_`~#]/g, '');
        speak(spokenText);
        
        setMessages(prev => [...prev, { role: 'ai', text: result.answer }]);

        if (result.action?.name === 'logExpense') {
            onLogExpense(result.action.parameters);
        }

    } catch (error) {
        console.error("AI Assistant Error:", error);
        const errorMessage = "I've encountered an issue and can't respond right now. Please try again later.";
        
        setMessages(prev => [...prev, { role: 'ai', text: errorMessage }]);

        if (error instanceof Error && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
             toast({ variant: 'destructive', title: 'Rate Limit Exceeded', description: "You've made too many requests. Please wait a moment." });
        } else {
            const errorDescription = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'AI Assistant Error', description: errorDescription });
        }
    } finally {
        setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(handleVoiceResult);
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
            className="w-full"
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
                <div className="relative flex w-full items-center">
                    <Input
                        placeholder='Ask a question or log an expense...'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10 h-11"
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleListening}
                        disabled={isLoading}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-8 w-8"
                    >
                        <Mic className="h-4 w-4" />
                        <span className="sr-only">Use Microphone</span>
                    </Button>
                    <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        disabled={isLoading || !query.trim()}
                        className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8",
                             query.trim() ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Submit</span>
                    </Button>
                </div>
            )}
        </form>
      </CardFooter>
    </Card>
  );
}
