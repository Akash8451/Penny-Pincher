import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/lib/types";
import { DollarSign, ReceiptText, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface SummaryCardsProps {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
  const [summary, setSummary] = useState({ total: 0, count: 0, average: 0 });

  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenses = expenses.filter(
      (exp) => new Date(exp.date) >= firstDayOfMonth
    );
    
    const onlySpending = monthlyExpenses.filter(exp => exp.type === 'expense');

    const total = onlySpending.reduce((sum, exp) => sum + exp.amount, 0);
    const count = onlySpending.length;
    const average = count > 0 ? total / count : 0;
    
    setSummary({ total, count, average });
  }, [expenses]);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month's Spending
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.total.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total expenses this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{summary.count}</div>
          <p className="text-xs text-muted-foreground">
            Transactions made this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.average.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average transaction value this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
