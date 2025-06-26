'use client'

import * as React from 'react'
import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from 'recharts'
import type { Expense, Category } from '@/lib/types'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface ExpensesByCategoryChartProps {
  expenses: Expense[];
  categories: Category[];
}

export default function ExpensesByCategoryChart({ expenses, categories }: ExpensesByCategoryChartProps) {
  const categoryMap = React.useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const data = React.useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      if (expense.type !== 'expense') return acc;
      const categoryName = categoryMap.get(expense.categoryId) || 'Uncategorized'
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  }, [expenses, categoryMap])

  return (
    <div className="h-[250px] w-full pt-4">
        {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    stroke="hsl(var(--background))"
                    >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Legend iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Log some expenses to see your spending categories.
            </div>
        )}
    </div>
  )
}
