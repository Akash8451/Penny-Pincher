
'use client';

import { AppHeader } from '@/components/layout/app-header';
import RecentExpenses from '@/components/dashboard/recent-expenses';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import AIAssistant from '@/components/dashboard/ai-assistant';
import SavingsGoal from '@/components/dashboard/savings-goal';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnalyticsOverview from '@/components/dashboard/analytics-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';

function DashboardSkeleton() {
  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-4 sm:p-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[210px] rounded-lg" />
          <Skeleton className="h-[210px] rounded-lg" />
        </div>
        <Skeleton className="h-[460px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
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

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-4 sm:p-6">

        {/* Savings and AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SavingsGoal expenses={expenses} />
            <AIAssistant 
                expenses={expenses} 
                categories={categories} 
                people={people}
                onLogExpense={handleLogExpense}
            />
        </div>

        {/* Analytics Section */}
        <AnalyticsOverview expenses={expenses} categories={categories} />
        
        {/* Recent Transactions Section */}
        <Card>
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <RecentExpenses 
                    expenses={expenses} 
                    categories={categories}
                    isDashboardList={true} 
                />
            </CardContent>
        </Card>
      </div>
    </>
  );
}
