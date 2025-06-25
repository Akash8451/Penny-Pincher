'use client'

import { useState, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import Link from 'next/link'
import * as Lucide from 'lucide-react'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

import { useLocalStorage } from '@/hooks/use-local-storage'
import type { Expense, Category, Person } from '@/lib/types'
import { DateRangePicker } from './date-range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function TransactionList() {
  const [expenses] = useLocalStorage<Expense[]>('expenses', [])
  const [categories] = useLocalStorage<Category[]>('categories', [])
  const [people] = useLocalStorage<Person[]>('people', [])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (!dateRange || !dateRange.from) return true
      const expenseDate = new Date(expense.date)
      const toDate = dateRange.to || dateRange.from;
      return isWithinInterval(expenseDate, { start: startOfDay(dateRange.from), end: endOfDay(toDate) })
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, dateRange])

  const handleItemClick = (id: string) => {
    setSelectedExpenseId(prevId => (prevId === id ? null : id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>History</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                <Button variant="ghost" onClick={() => setDateRange(undefined)}>Reset</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-2 pr-2">
            {filteredExpenses.map((expense) => {
                const category = categories.find(c => c.id === expense.categoryId);
                const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
                const splitWithNames = expense.splitWith?.map(split => peopleMap.get(split.personId) || 'Unknown').filter(Boolean).join(', ');
                const isSelected = selectedExpenseId === expense.id;

                return (
                    <div
                        key={expense.id}
                        className={cn(
                            "p-3 rounded-lg transition-all duration-200 cursor-pointer",
                            isSelected ? "ring-2 ring-primary bg-accent/80" : "hover:bg-accent/50"
                        )}
                        onClick={() => handleItemClick(expense.id)}
                    >
                        <div className="flex items-center flex-1 min-w-0 gap-4">
                            <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {expense.note || category?.name || 'Uncategorized'}
                                </p>
                                <div className="flex items-baseline gap-2">
                                     <p className="text-sm text-muted-foreground truncate">
                                        {expense.type === 'expense' && splitWithNames 
                                            ? `Split with: ${splitWithNames}`
                                            : format(new Date(expense.date), "MMM d, yyyy")
                                        }
                                    </p>
                                    <p className={`ml-auto font-semibold text-base ${expense.type === 'expense' ? 'text-destructive' : 'text-green-500'}`}>
                                        {expense.type === 'expense' ? '-' : '+'} ${expense.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isSelected && (
                            <div className="mt-3 flex justify-end animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                                <Button asChild variant="outline" size="sm" className="rounded-full px-4">
                                    <Link href={`/transactions/${expense.id}`}>
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
            {filteredExpenses.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No transactions found for the selected period.
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
