
'use client';

import * as React from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import type { Expense } from '@/lib/types';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, isWithinInterval } from 'date-fns';
import { useCurrencyFormatter } from '@/hooks/use-currency-formatter';
import { useTheme } from 'next-themes';

interface SpendingTrendLineChartProps {
  expenses: Expense[];
  period: 'week' | 'month' | 'year';
}

const CustomTooltip = ({ active, payload, label }: any) => {
    const formatCurrency = useCurrencyFormatter();
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/80 backdrop-blur-lg p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-1">
            <span className="text-[0.7rem] uppercase text-muted-foreground">
                {label}
            </span>
            <span className="font-bold text-foreground">
                {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
  
    return null;
};


export default function SpendingTrendLineChart({ expenses, period }: SpendingTrendLineChartProps) {
  const { resolvedTheme } = useTheme();
  
  const data = React.useMemo(() => {
    const expenseOnly = expenses.filter(e => e.type === 'expense');
    const today = new Date();

    if (period === 'week') {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
      
      return daysInWeek.map(day => {
        const dayString = format(day, 'eee');
        const total = expenseOnly
          .filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
          .reduce((sum, e) => sum + e.amount, 0);
        return { name: dayString, total };
      });
    }

    if (period === 'month') {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        
        return daysInMonth.map(day => {
            const dayString = format(day, 'd');
            const total = expenseOnly
            .filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
            .reduce((sum, e) => sum + e.amount, 0);
            return { name: dayString, total };
        });
    }
    
    if (period === 'year') {
        const yearStart = startOfYear(today);
        const monthsInYear = eachMonthOfInterval({ start: yearStart, end: today });

        return monthsInYear.map(month => {
            const monthString = format(month, 'MMM');
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const total = expenseOnly
                .filter(e => isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }))
                .reduce((sum, e) => sum + e.amount, 0);
            return { name: monthString, total };
        });
    }

    return [];
  }, [expenses, period]);

  const strokeColor = resolvedTheme === 'dark' ? '#FFFFFF' : '#171717'; // foreground color

  return (
    <div className="h-[200px] w-full -ml-4">
      {data.some(d => d.total > 0) ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
             <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={period === 'month' ? 6 : 'preserveStartEnd'}
              padding={{ left: 10, right: 10 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, className: 'stroke-primary fill-background' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No spending data for this period.
        </div>
      )}
    </div>
  );
}
