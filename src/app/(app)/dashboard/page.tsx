
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
import { ReceiptText, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AnalyticsOverview from '@/components/dashboard/analytics-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';

function DashboardSkeleton() {
  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-4 sm:p-6 animate-pulse">
        <Skeleton className="h-[125px] w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[210px] rounded-lg md:col-span-1 lg:col-span-3" />
          <Skeleton className="h-[210px] rounded-lg md:col-span-1 lg:col-span-4" />
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <div className="grid w-full grid-cols-2 gap-2 mb-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-center justify-center h-[250px] w-full">
                    <Skeleton className="h-48 w-48 rounded-full" />
                </div>
            </CardContent>
        </Card>
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);
  const [summary, setSummary] = useState({ total: 0, count: 0, average: 0 });
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const formatCurrency = useCurrencyFormatter();

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);


  useEffect(() => {
    const allTransactions = expenses;
    
    const allSpending = allTransactions.filter(exp => exp.type === 'expense');
    const allIncome = allTransactions.filter(exp => exp.type === 'income');

    const totalSpending = allSpending.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = allIncome.reduce((sum, exp) => sum + exp.amount, 0);
    
    const netSpending = totalSpending - totalIncome;
    const transactionCount = allTransactions.length;
    const averageSpending = allSpending.length > 0 ? totalSpending / allSpending.length : 0;

    setSummary({ total: netSpending, count: transactionCount, average: averageSpending });
  }, [expenses]);

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };
  
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
        
        {/* Quick Stats Card */}
        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
                Quick Stats
            </CardTitle>
            <Badge variant="outline">
                <ReceiptText className="mr-2 h-4 w-4" />
                {summary.count} Transactions
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Net Spending</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{formatCurrency(summary.total)}</span>
                        <span className={`flex items-center text-xs ${summary.total > 0 ? 'text-destructive' : 'text-green-500'}`}>
                           {summary.total > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                           vs last period
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Average Expense</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{formatCurrency(summary.average)}</span>
                         <span className="flex items-center text-xs text-muted-foreground">
                           <TrendingUp className="h-4 w-4" />
                           Steady
                        </span>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

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
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            <AccordionItem value="item-1" className="border-none">
                 <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <CardHeader className="flex-1 p-0 text-left">
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <RecentExpenses expenses={expenses} categories={categories} people={people} onDeleteExpense={handleDeleteExpense} />
                    </AccordionContent>
                 </Card>
            </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
