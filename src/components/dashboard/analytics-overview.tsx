
'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Category, Expense } from '@/lib/types'
import SpendingTrendLineChart from './spending-trend-line-chart'
import RecentExpenses from './recent-expenses'
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns'

interface AnalyticsOverviewProps {
  expenses: Expense[];
  categories: Category[];
}

type Period = 'week' | 'month' | 'year';

export default function AnalyticsOverview({ expenses, categories }: AnalyticsOverviewProps) {
  const [period, setPeriod] = React.useState<Period>('month');
  const formatCurrency = useCurrencyFormatter();

  const { total, dateRangeText, topExpenses } = React.useMemo(() => {
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

    const sortedExpenses = [...filtered].sort((a,b) => b.amount - a.amount);
    
    return { 
      total: currentTotal,
      dateRangeText: dateText,
      topExpenses: sortedExpenses.slice(0, 3),
    };
  }, [expenses, period]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Spending Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <span className="text-sm text-muted-foreground">{dateRangeText}</span>
            <p className="text-4xl font-bold">{formatCurrency(total)}</p>
        </div>

        <Tabs defaultValue={period} onValueChange={(value) => setPeriod(value as Period)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
        </Tabs>
        
        <SpendingTrendLineChart expenses={expenses} period={period} />
        
        <div>
            <h3 className="text-lg font-semibold mb-2">Top Spending this {period}</h3>
            <RecentExpenses 
                expenses={topExpenses} 
                categories={categories}
            />
        </div>

      </CardContent>
    </Card>
  )
}
