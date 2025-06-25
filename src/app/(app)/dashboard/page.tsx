
'use client';

import { AppHeader } from '@/components/layout/app-header';
import QuickExpenseForm from '@/components/dashboard/quick-expense-form';
import RecentExpenses from '@/components/dashboard/recent-expenses';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Expense, Person } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import ExpensesByCategoryChart from '@/components/dashboard/expenses-by-category-chart';
import SpendingTrendChart from '@/components/dashboard/spending-trend-chart';
import AIAssistant from '@/components/dashboard/ai-assistant';
import SavingsGoal from '@/components/dashboard/savings-goal';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ReceiptText, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [people] = useLocalStorage<Person[]>('people', []);
  const [summary, setSummary] = useState({ total: 0, count: 0, average: 0 });

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


  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Net Spending
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">${summary.total.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                    Total expenses minus total income
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <ReceiptText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{summary.count}</div>
                <p className="text-xs text-muted-foreground">
                    All recorded income and expenses
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">${summary.average.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                    Average value of all expense transactions
                </p>
                </CardContent>
            </Card>
            <SavingsGoal expenses={expenses} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AIAssistant expenses={expenses} categories={categories} people={people} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <RecentExpenses expenses={expenses} categories={categories} people={people} onDeleteExpense={handleDeleteExpense} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ExpensesByCategoryChart expenses={expenses} categories={categories} />
            <SpendingTrendChart expenses={expenses} />
        </div>
      </div>
    </>
  );
}
