
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/lib/types";
import { DollarSign, ReceiptText, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface SummaryCardsProps {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
  const { total, count, average } = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenses = expenses.filter(
      (exp) => new Date(exp.date) >= firstDayOfMonth
    );

    const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = monthlyExpenses.length;
    const average = count > 0 ? total / count : 0;
    
    return { total, count, average };
  }, [expenses]);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="neumorphic-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month's Spending
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${total.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total expenses this month
          </p>
        </CardContent>
      </Card>
      <Card className="neumorphic-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{count}</div>
          <p className="text-xs text-muted-foreground">
            Transactions made this month
          </p>
        </CardContent>
      </Card>
      <Card className="neumorphic-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${average.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average transaction value this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
