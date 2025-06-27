
'use client';

import { AppHeader } from '@/components/layout/app-header';
import AIAssistant from '@/components/dashboard/ai-assistant';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function AssistantSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 animate-pulse h-full">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

export default function AssistantPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogExpense = (details: { amount: number, categoryId: string, note: string }) => {
    const newExpense: Expense = {
      ...details,
      id: `exp-${new Date().getTime()}`,
      type: 'expense',
      date: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);

    const categoryName = categories.find(c => c.id === details.categoryId)?.name || 'a category';
    toast({
        title: `✔️ ${formatCurrency(details.amount)} added`,
        description: `Logged to ${categoryName}.`,
    });
  };
  
  return (
    <>
      <AppHeader title="AI Assistant">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
      </AppHeader>
      <div className="flex-1 flex flex-col p-4">
        {isClient ? (
          <AIAssistant 
            expenses={expenses} 
            categories={categories} 
            people={people}
            onLogExpense={handleLogExpense}
            isFullPage={true}
          />
        ) : (
          <AssistantSkeleton />
        )}
      </div>
    </>
  );
}
