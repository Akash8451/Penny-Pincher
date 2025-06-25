
'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Expense } from '@/lib/types';
import { format, subDays } from 'date-fns';

interface SpendingTrendChartProps {
  expenses: Expense[];
}

export default function SpendingTrendChart({ expenses }: SpendingTrendChartProps) {
  const data = React.useMemo(() => {
    const dailyTotals: { [key: string]: number } = {};
    const today = new Date();
    
    // Initialize last 7 days with 0 spending
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const formattedDate = format(day, 'MMM d');
      dailyTotals[formattedDate] = 0;
    }

    // Sum expenses for the last 7 days
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= subDays(today, 6)) {
        const formattedDate = format(expenseDate, 'MMM d');
        if(dailyTotals[formattedDate] !== undefined) {
           dailyTotals[formattedDate] += expense.amount;
        }
      }
    });

    return Object.entries(dailyTotals).map(([name, total]) => ({
      name,
      total,
    }));
  }, [expenses]);
  
  return (
    <Card className="lg:col-span-4 neumorphic-shadow">
      <CardHeader>
        <CardTitle>Spending Trend</CardTitle>
        <CardDescription>Your spending over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent))' }}
                contentStyle={{ 
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
