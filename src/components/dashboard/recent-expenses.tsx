
'use client';

import { useState } from "react";
import type { Category, Expense } from "@/lib/types";
import { format } from 'date-fns';
import * as Lucide from 'lucide-react';
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import { CardFooter } from "../ui/card";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
  isDashboardList?: boolean; // To control 'View All' button and item limit
  onDeleteExpense?: (expenseId: string) => void;
}

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function RecentExpenses({ expenses, categories, isDashboardList = false, onDeleteExpense }: RecentExpensesProps) {
  const formatCurrency = useCurrencyFormatter();
  const itemsToDisplay = isDashboardList ? expenses.slice(0, 5) : expenses;
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    if (onDeleteExpense) {
      setSelectedExpenseId(prevId => (prevId === id ? null : id));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, expenseId: string) => {
    e.stopPropagation(); 
    onDeleteExpense?.(expenseId);
    setSelectedExpenseId(null);
  };
  
  return (
    <>
      <div className="space-y-2">
        {itemsToDisplay.map((expense) => {
            const category = categories.find(c => c.id === expense.categoryId);
            const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
            const isSelected = selectedExpenseId === expense.id;

            const content = (
              <div
                  className={cn(
                      "p-3 rounded-lg border transition-all duration-200",
                      isSelected ? "border-primary bg-accent/80" : "border-transparent bg-muted/50",
                      onDeleteExpense ? "cursor-pointer hover:bg-accent/80" : "hover:bg-accent/80"
                  )}
                  onClick={() => onDeleteExpense ? handleItemClick(expense.id) : null}
              >
                  <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-card-foreground">
                              {expense.note || category?.name || 'Uncategorized'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                              {format(new Date(expense.date), "d MMM, yyyy")}
                          </p>
                      </div>
                       <div className="flex-shrink-0 pl-2 text-right">
                         <p className={cn(
                           "font-semibold",
                           expense.type === 'expense' ? 'text-destructive' : 'text-green-500'
                         )}>
                            {expense.type === 'expense' ? '-' : '+'} {formatCurrency(expense.amount)}
                         </p>
                       </div>
                  </div>

                  {isSelected && (
                      <div className="mt-3 flex justify-end items-center gap-2 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="h-9 w-9 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this expense record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setSelectedExpenseId(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => handleDeleteClick(e, expense.id)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Button asChild variant="outline" size="sm" className="h-9">
                              <Link href={`/transactions/${expense.id}`}>
                                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                          </Button>
                      </div>
                  )}
              </div>
            );

            return onDeleteExpense ? (
              <div key={expense.id}>{content}</div>
            ) : (
              <Link key={expense.id} href={`/transactions/${expense.id}`} className="block">{content}</Link>
            )
        })}
        {itemsToDisplay.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                {isDashboardList ? 'No transactions yet. Add one to get started!' : 'No spending in this period.'}
            </div>
        )}
      </div>
      {isDashboardList && expenses.length > 5 && (
        <CardFooter className="pt-4 px-0">
          <Button asChild className="w-full" variant="outline">
              <Link href="/transactions">
                  View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
          </Button>
        </CardFooter>
      )}
    </>
  );
}
