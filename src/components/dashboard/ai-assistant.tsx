
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Sparkles, Lock } from 'lucide-react';
import React from 'react';
import { askAssistant } from '@/ai/flows/assistant-flow';
import type { Category, Expense, Person } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface AIAssistantProps {
    expenses: Expense[];
    categories: Category[];
    people: Person[];
}

export default function AIAssistant({ expenses, categories, people }: AIAssistantProps) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState('');

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
        toast({
            variant: 'destructive',
            title: 'Empty Query',
            description: 'Please ask a question.',
        });
        return;
    }

    setIsLoading(true);
    setResponse('');

    try {
        const result = await askAssistant({ query, expenses, categories, people });
        setResponse(result.answer);
    } catch (error) {
        console.error("AI Assistant Error:", error);
        toast({
            variant: 'destructive',
            title: 'AI Assistant Error',
            description: 'There was a problem getting a response. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const exampleQueries = [
    "What was my total spending last month?",
    "Show me all transactions in the 'Food & Drinks' category.",
    "What's my biggest expense so far?",
    "How much money do I owe from split bills?",
  ];

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  }

  return (
    <Card className="h-full transition-all duration-300 bg-secondary/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl'>
            <Lock className='h-4 w-4 text-muted-foreground' />
            <Wand2 className='text-primary' />
            AI Assistant
        </CardTitle>
        <CardDescription>Ask questions about your finances. Your data is processed securely on-device.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAsk} className="flex gap-2 mb-4">
            <Input 
                placeholder='e.g., "How much did I spend on coffee?"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? 'Thinking...' : 'Ask'}
            </Button>
        </form>
        <div className="text-xs text-muted-foreground mb-4">
            Try an example: {exampleQueries.map((ex, i) => (
                <React.Fragment key={i}>
                    <button onClick={() => handleExampleClick(ex)} className="underline hover:text-primary mx-1 disabled:text-muted-foreground disabled:no-underline" disabled={isLoading}>{ex}</button>
                    {i < exampleQueries.length - 1 && '•'}
                </React.Fragment>
            ))}
        </div>

        {isLoading && (
            <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        )}

        {response && (
            <div className="p-4 bg-background/50 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }} />
            </div>
        )}
      </CardContent>
    </Card>
  );
}
