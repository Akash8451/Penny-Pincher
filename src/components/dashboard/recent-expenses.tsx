
import type { Category, Expense, Person } from "@/lib/types";
import { format } from 'date-fns';
import * as Lucide from 'lucide-react';
import Link from "next/link";
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
import { Button } from "../ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CardFooter } from "../ui/card";

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
  people: Person[];
  onDeleteExpense: (expenseId: string) => void;
}

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function RecentExpenses({ expenses, categories, people, onDeleteExpense }: RecentExpensesProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const peopleMap = new Map(people.map((p) => [p.id, p.name]));
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    setSelectedExpenseId(prevId => (prevId === id ? null : id));
  };


  return (
    <>
      <div className="space-y-2">
          {expenses.slice(0, 3).map((expense) => {
              const category = categories.find(c => c.id === expense.categoryId);
              const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
              const splitWithNames = expense.splitWith?.map(split => peopleMap.get(split.personId)).filter(Boolean).join(', ');
              const isSelected = selectedExpenseId === expense.id;

              return (
                  <div
                      key={expense.id}
                      className={cn(
                          "p-3 rounded-lg border border-transparent transition-all duration-200 cursor-pointer",
                          isSelected && "border-primary bg-accent/80"
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
                          <div className="mt-3 flex justify-end items-center gap-3 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                              <AlertDialog onOpenChange={(open) => !open && setSelectedExpenseId(null)}>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete</span>
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
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onDeleteExpense(expense.id)} className="bg-destructive hover:bg-destructive/90">
                                          Delete
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                              <Button asChild variant="outline" size="sm" className="h-9 rounded-full">
                                  <Link href={`/transactions/${expense.id}`}>
                                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                              </Button>
                          </div>
                      )}
                  </div>
              );
          })}
          {expenses.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                  No transactions yet. Add one to get started!
              </div>
          )}
      </div>
      <CardFooter className="pt-4 px-0">
        <Button asChild className="w-full" variant="outline">
            <Link href="/transactions">
                View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </>
  );
}
