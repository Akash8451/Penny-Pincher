
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category, Expense } from "@/lib/types";
import { format } from 'date-fns';
import * as Lucide from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
}

// A type guard to check if a string is a valid Lucide icon name
function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function RecentExpenses({ expenses, categories }: RecentExpensesProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <Card className="lg:col-span-4 neumorphic-shadow">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your last 5 expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <ScrollArea className="h-[350px]">
            <div className="space-y-4">
                {expenses.slice(0, 10).map((expense) => {
                    const category = categoryMap.get(expense.categoryId);
                    const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
                    return (
                        <div key={expense.id} className="flex items-center">
                            <div className="h-9 w-9 bg-accent rounded-full flex items-center justify-center mr-4">
                               <Icon className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {category?.name || 'Uncategorized'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {expense.note || format(new Date(expense.date), "PPP")}
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-right">
                                <p>${expense.amount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "MMM d")}</p>
                            </div>
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
