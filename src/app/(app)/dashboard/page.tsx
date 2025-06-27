
'use client';

import { AppHeader } from '@/components/layout/app-header';
import RecentExpenses from '@/components/dashboard/recent-expenses';
import type { Expense } from '@/lib/types';
import AIAssistant from '@/components/dashboard/ai-assistant';
import SavingsGoal from '@/components/dashboard/savings-goal';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnalyticsOverview from '@/components/dashboard/analytics-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenses } from '@/hooks/use-expenses';

function DashboardSkeleton() {
  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-2 sm:p-4 animate-pulse">
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
  const { expenses, categories, people, addTransaction, deleteTransaction } = useExpenses();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-2 sm:p-4">

        {/* Savings and AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SavingsGoal expenses={expenses} />
            <AIAssistant 
                expenses={expenses} 
                categories={categories} 
                people={people}
                onLogExpense={(details) => addTransaction({ ...details, type: 'expense' })}
            />
        </div>

        {/* Analytics Section */}
        <AnalyticsOverview expenses={expenses} categories={categories} onDeleteExpense={deleteTransaction} />
        
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
                    onDeleteExpense={deleteTransaction}
                />
            </CardContent>
        </Card>
      </div>
    </>
  );
}
