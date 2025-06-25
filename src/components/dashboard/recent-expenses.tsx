
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category, Expense, Person } from "@/lib/types";
import { format } from 'date-fns';
import * as Lucide from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Trash2 } from "lucide-react";

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
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const peopleMap = new Map(people.map((p) => [p.id, p]));


  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your last 10 expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <ScrollArea className="h-[350px]">
            <div className="space-y-1">
                {expenses.slice(0, 10).map((expense) => {
                    const category = categoryMap.get(expense.categoryId);
                    const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
                    const splitWithNames = expense.splitWith?.map(split => peopleMap.get(split.personId)?.name).filter(Boolean).join(', ');

                    return (
                        <div key={expense.id} className="flex items-center p-2 rounded-lg hover:bg-accent/50">
                            <div className="h-9 w-9 bg-accent rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                               <Icon className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                                <p className="text-sm font-medium leading-none">
                                    {category?.name || 'Uncategorized'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {expense.note || format(new Date(expense.date), "PPP")}
                                </p>
                                {splitWithNames && (
                                   <p className="text-xs text-muted-foreground truncate">
                                     Split with: {splitWithNames}
                                   </p>
                                )}
                            </div>
                            <div className="ml-auto font-medium text-right flex-shrink-0 px-2">
                                <p className="text-destructive font-semibold">- ${expense.amount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "MMM d")}</p>
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0">
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
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteExpense(expense.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    );
                })}
                {expenses.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        No transactions yet. Add one to get started!
                    </div>
                )}
            </div>
         </ScrollArea>
      </CardContent>
    </Card>
  );
}
