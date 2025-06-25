'use client';

import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Expense, SavingsGoal } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Target, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface SavingsGoalProps {
    expenses: Expense[];
}

export default function SavingsGoal({ expenses }: SavingsGoalProps) {
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>('savings-goals', []);
  const { toast } = useToast();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const currentGoal = goals.find(g => g.month === currentMonthStr);

  const { savedAmount, progress } = useMemo(() => {
    if (!currentGoal) return { savedAmount: 0, progress: 0 };
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTransactions = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });

    const income = monthTransactions.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const spending = monthTransactions.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    
    const saved = income - spending;
    const progressPercentage = Math.max(0, (saved / currentGoal.amount) * 100);

    return { savedAmount: saved, progress: progressPercentage };
  }, [expenses, currentGoal]);

  if (progress >= 100 && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
  }

  const handleOpenForm = (goal: SavingsGoal | null) => {
    setEditingGoal(goal);
    setGoalName(goal?.name || '');
    setGoalAmount(goal?.amount.toString() || '');
    setFormOpen(true);
  };
  
  const handleSaveGoal = () => {
    const amount = parseFloat(goalAmount);
    if (!goalName || !amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid name and positive amount.' });
      return;
    }
    
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, name: goalName, amount } : g));
      toast({ title: 'Goal Updated!', description: `Your goal to save $${amount} has been updated.` });
    } else {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}`,
        name: goalName,
        amount,
        month: currentMonthStr
      };
      setGoals([...goals, newGoal]);
      toast({ title: 'Goal Set!', description: `You're aiming to save $${amount} this month. You can do it!` });
    }
    
    setFormOpen(false);
  };

  const handleDeleteGoal = () => {
    if (currentGoal) {
        setGoals(goals.filter(g => g.id !== currentGoal.id));
        toast({ title: 'Goal Removed', description: 'Your savings goal for this month has been removed.' });
    }
  };


  return (
    <Card>
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Target className="text-primary" />
            This Month's Savings Goal
        </CardTitle>
        {currentGoal && <CardDescription>{currentGoal.name}</CardDescription>}
      </CardHeader>
      <CardContent>
        {currentGoal ? (
            <div className="space-y-4">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">
                    Saved: <span className="text-foreground font-bold">${savedAmount.toFixed(2)}</span>
                </span>
                <span className="font-medium text-muted-foreground">
                    Goal: <span className="text-foreground font-bold">${currentGoal.amount.toFixed(2)}</span>
                </span>
              </div>
              {progress >= 100 && <p className="text-center font-semibold text-green-500">🎉 Goal Achieved! 🎉</p>}
            </div>
        ) : (
            <div className="text-center text-muted-foreground py-4">
                <p>You haven't set a savings goal for this month yet.</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
         {currentGoal ? (
            <>
                <Button variant="ghost" size="sm" onClick={handleDeleteGoal}><Trash2 className="mr-2 h-4 w-4" /> Delete Goal</Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(currentGoal)}><Edit className="mr-2 h-4 w-4" /> Edit Goal</Button>
            </>
         ) : (
             <Button size="sm" onClick={() => handleOpenForm(null)}><PlusCircle className="mr-2 h-4 w-4"/> Set a New Goal</Button>
         )}
      </CardFooter>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit' : 'Set'} Savings Goal for {format(new Date(), 'MMMM yyyy')}</DialogTitle>
              <DialogDescription>
                How much are you aiming to save this month?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid items-center gap-2">
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input id="goal-name" placeholder="e.g., Save for Vacation" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
                </div>
                <div className="grid items-center gap-2">
                    <Label htmlFor="goal-amount">Amount</Label>
                    <Input id="goal-amount" type="number" placeholder="3000" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={handleSaveGoal}>Save Goal</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
