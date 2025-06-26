
import type { Category, Expense } from "@/lib/types";
import { format } from 'date-fns';
import * as Lucide from 'lucide-react';
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { CardFooter } from "../ui/card";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
  isDashboardList?: boolean; // To control 'View All' button and item limit
}

function isValidIcon(iconName: string): iconName is keyof typeof Lucide {
  return iconName in Lucide;
}

export default function RecentExpenses({ expenses, categories, isDashboardList = false }: RecentExpensesProps) {
  const formatCurrency = useCurrencyFormatter();
  const itemsToDisplay = isDashboardList ? expenses.slice(0, 5) : expenses;

  return (
    <>
      <div className="space-y-2">
        {itemsToDisplay.map((expense) => {
            const category = categories.find(c => c.id === expense.categoryId);
            const Icon = category && isValidIcon(category.icon) ? Lucide[category.icon] as React.ElementType : Lucide.Package;
            return (
                <Link key={expense.id} href={`/transactions/${expense.id}`} className="flex items-center p-3 rounded-lg bg-muted/50 hover:bg-accent/80 transition-colors">
                    <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center flex-shrink-0 mr-4 shadow-sm">
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
                     <p className={cn(
                       "ml-4 font-semibold",
                       expense.type === 'expense' ? 'text-card-foreground' : 'text-green-500'
                     )}>
                        {expense.type === 'expense' ? '-' : '+'} {formatCurrency(expense.amount)}
                    </p>
                </Link>
            );
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
