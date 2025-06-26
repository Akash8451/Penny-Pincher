'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Category, Expense } from '@/lib/types'
import SpendingTrendLineChart from './spending-trend-line-chart'
import RecentExpenses from './recent-expenses'
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns'
import ExpensesByCategoryChart from './expenses-by-category-chart'

interface AnalyticsOverviewProps {
  expenses: Expense[];
  categories: Category[];
  onDeleteExpense: (id: string) => void;
}

type Period = 'week' | 'month' | 'year';

export default function AnalyticsOverview({ expenses, categories, onDeleteExpense }: AnalyticsOverviewProps) {
  const [period, setPeriod] = React.useState<Period>('month');
  const formatCurrency = useCurrencyFormatter();

  const { total, dateRangeText, periodExpenses } = React.useMemo(() => {
    const expenseOnly = expenses.filter(e => e.type === 'expense');
    const today = new Date();
    let start, end;
    let dateText = '';

    if (period === 'week') {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
      dateText = `${format(start, 'd MMM')} - ${format(end, 'd MMM, yyyy')}`;
    } else if (period === 'year') {
      start = startOfYear(today);
      end = endOfYear(today);
      dateText = format(today, 'yyyy');
    } else { // month
      start = startOfMonth(today);
      end = endOfMonth(today);
      dateText = format(today, 'MMMM yyyy');
    }

    const filtered = expenseOnly.filter(e => isWithinInterval(new Date(e.date), { start, end }));
    const currentTotal = filtered.reduce((sum, e) => sum + e.amount, 0);
    
    return { 
      total: currentTotal,
      dateRangeText: dateText,
      periodExpenses: filtered,
    };
  }, [expenses, period]);

  const topExpenses = React.useMemo(() => {
    return [...periodExpenses].sort((a,b) => b.amount - a.amount).slice(0, 3);
  }, [periodExpenses]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Spending Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <span className="text-sm text-muted-foreground">{dateRangeText}</span>
            <p className="text-4xl font-bold text-destructive">{formatCurrency(total)}</p>
        </div>

        <Tabs defaultValue={period} onValueChange={(value) => setPeriod(value as Period)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
        </Tabs>
        
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trend">Spending Trend</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>
          <TabsContent value="trend" className="space-y-4 pt-4">
            <SpendingTrendLineChart expenses={periodExpenses} period={period} />
            <div>
              <h3 className="text-lg font-semibold mb-2">Top Spending</h3>
              <RecentExpenses 
                  expenses={topExpenses} 
                  categories={categories}
                  onDeleteExpense={onDeleteExpense}
              />
            </div>
          </TabsContent>
          <TabsContent value="category">
            <ExpensesByCategoryChart expenses={periodExpenses} categories={categories} />
          </TabsContent>
        </Tabs>

      </CardContent>
    </Card>
  )
}
