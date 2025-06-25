
'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Category, Expense } from '@/lib/types'
import ExpensesByCategoryChart from './expenses-by-category-chart'
import SpendingTrendChart from './spending-trend-chart'

interface AnalyticsOverviewProps {
  expenses: Expense[];
  categories: Category[];
}

export default function AnalyticsOverview({ expenses, categories }: AnalyticsOverviewProps) {
  return (
    <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>A visual breakdown of your spending habits.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="trends">7-Day Trend</TabsTrigger>
            </TabsList>
            <TabsContent value="categories">
                <ExpensesByCategoryChart expenses={expenses} categories={categories} />
            </TabsContent>
            <TabsContent value="trends">
                <SpendingTrendChart expenses={expenses} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
