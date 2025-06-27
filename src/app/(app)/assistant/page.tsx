
'use client';

import { AppHeader } from '@/components/layout/app-header';
import AIAssistant from '@/components/dashboard/ai-assistant';
import { useExpenses } from '@/hooks/use-expenses';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const maxDuration = 60;

function AssistantSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 animate-pulse h-full">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

export default function AssistantPage() {
  const { expenses, categories, people, addTransaction } = useExpenses();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogExpense = (details: { amount: number, categoryId: string, note: string }) => {
    addTransaction({
        ...details,
        type: 'expense'
    });
  };
  
  return (
    <>
      <AppHeader title="AI Assistant" />
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="mb-4">
            <Button onClick={() => router.back()} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
        </div>
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
