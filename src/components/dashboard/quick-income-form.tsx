
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, Expense } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle } from 'lucide-react';
import React from 'react';

interface QuickIncomeFormProps {
  categories: Category[];
  onAddIncome: (income: Omit<Expense, 'id' | 'date' | 'type'>) => void;
  onSuccess: () => void;
}

const incomeSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().positive({ message: "Amount must be positive." })
  ),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  note: z.string().max(100, "Note is too long.").optional(),
});

export default function QuickIncomeForm({ categories, onAddIncome, onSuccess }: QuickIncomeFormProps) {
  const form = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { amount: '', categoryId: '', note: '' },
  });

  const categoryGroups = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const onSubmit = (values: z.infer<typeof incomeSchema>) => {
    onAddIncome({
        ...values,
        amount: values.amount!,
    });
    form.reset();
    onSuccess();
  };

  return (
    <div className='space-y-2'>
        <div className="text-center">
            <h3 className="text-lg font-medium">Log Income</h3>
            <p className="text-sm text-muted-foreground">Add any income you've received.</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryGroups).map(([group, cats]) => (
                          <SelectGroup key={group}>
                            <Label className='px-2 text-xs text-muted-foreground'>{group}</Label>
                            {cats.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Monthly Salary, Freelance Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Income
                </Button>
              </div>
            </form>
          </Form>
    </div>
  );
}
