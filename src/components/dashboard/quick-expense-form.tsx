
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Paperclip, PlusCircle } from 'lucide-react';
import React from 'react';

interface QuickExpenseFormProps {
  categories: Category[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
}

const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  note: z.string().max(100, "Note is too long.").optional(),
  receipt: z.any().optional(),
});

export default function QuickExpenseForm({ categories, onAddExpense }: QuickExpenseFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: undefined, categoryId: '', note: '' },
  });

  const [fileName, setFileName] = React.useState('');

  const categoryGroups = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    // Basic file to data URL conversion for local storage
    if (values.receipt && values.receipt.length > 0) {
      const file = values.receipt[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        onAddExpense({ ...values, amount: values.amount, receipt: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      onAddExpense({ ...values, amount: values.amount });
    }

    toast({
      title: "Expense Added!",
      description: "Your expense has been logged successfully.",
    });
    form.reset();
    setFileName('');
  };

  return (
    <Card className="lg:col-span-3 neumorphic-shadow">
      <CardHeader>
        <CardTitle>Log Expense</CardTitle>
        <CardDescription>Quickly add a new transaction.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="$0.00" {...field} className="neumorphic-shadow-inset" onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} />
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
                      <SelectTrigger className="neumorphic-shadow-inset">
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
                    <Textarea placeholder="e.g. Lunch with colleagues" {...field} className="neumorphic-shadow-inset" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="receipt"
                render={({ field: { onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Receipt (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                          <Button asChild variant="outline" className="w-full justify-start text-muted-foreground font-normal neumorphic-shadow-inset">
                              <Label>
                                <Paperclip className="mr-2 h-4 w-4" />
                                {fileName || "Attach a file"}
                              </Label>
                          </Button>
                          <Input 
                              {...fieldProps}
                              type="file" 
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                              accept="image/*"
                              onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                      setFileName(file.name);
                                      onChange(e.target.files);
                                  }
                              }}
                          />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
