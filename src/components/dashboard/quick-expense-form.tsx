'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category, Expense, Person, Split } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Paperclip, PlusCircle, Users } from 'lucide-react';
import React from 'react';
import Confetti from 'react-confetti';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';


interface QuickExpenseFormProps {
  categories: Category[];
  people: Person[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
}

const expenseSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  note: z.string().max(100, "Note is too long.").optional(),
  receipt: z.any().optional(),
});

export default function QuickExpenseForm({ categories, people, onAddExpense }: QuickExpenseFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: undefined, categoryId: '', note: '' },
  });
  const totalAmount = Number(form.watch('amount')) || 0;

  const [fileName, setFileName] = React.useState('');
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [isSplitBillOpen, setSplitBillOpen] = React.useState(false);
  const [selectedPeople, setSelectedPeople] = React.useState<string[]>([]);
  const [customSplits, setCustomSplits] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // This check is important to prevent this code from running on the server
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      
      handleResize(); // Set initial size
      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const categoryGroups = React.useMemo(() => {
    return categories.reduce((acc, category) => {
      (acc[category.group] = acc[category.group] || []).push(category);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    let splitWithData: Split[] | undefined = undefined;

    if (selectedPeople.length > 0) {
      const customTotal = Object.values(customSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

      // If there are custom splits, validate them
      if (Object.keys(customSplits).length > 0) {
        if (Math.abs(customTotal - values.amount) > 0.01) {
             toast({
                variant: 'destructive',
                title: "Split Error",
                description: `The split amounts ($${customTotal.toFixed(2)}) do not add up to the total expense ($${values.amount.toFixed(2)}).`,
            });
            return;
        }
         splitWithData = selectedPeople.map(personId => ({
            personId,
            amount: parseFloat(customSplits[personId]) || 0,
            settled: false,
        }));
      } else {
        // Equal split
        const equalAmount = values.amount / selectedPeople.length;
        splitWithData = selectedPeople.map(personId => ({
            personId,
            amount: equalAmount,
            settled: false,
        }));
      }
    }


    const expenseData: Omit<Expense, 'id'|'date'> = {
      ...values,
      type: 'expense',
      amount: values.amount,
      splitWith: splitWithData,
    }

    if (values.receipt && values.receipt.length > 0) {
      const file = values.receipt[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        onAddExpense({ ...expenseData, receipt: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      onAddExpense(expenseData);
    }

    toast({
      title: "Expense Added!",
      description: "Your expense has been logged successfully.",
    });
    form.reset();
    setFileName('');
    setSelectedPeople([]);
    setCustomSplits({});
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };
  
  const togglePersonSelection = (personId: string) => {
    const newSelectedPeople = selectedPeople.includes(personId)
      ? selectedPeople.filter(id => id !== personId)
      : [...selectedPeople, personId];
    setSelectedPeople(newSelectedPeople);
    
    // Clear custom splits if selection changes
    setCustomSplits({});
  };

  const handleSplitEqually = () => {
    if (selectedPeople.length === 0 || totalAmount === 0) return;
    const equalAmount = (totalAmount / selectedPeople.length).toFixed(2);
    const newSplits = selectedPeople.reduce((acc, personId) => {
        acc[personId] = equalAmount;
        return acc;
    }, {} as Record<string, string>);
    setCustomSplits(newSplits);
  }
  
  const currentSplitTotal = React.useMemo(() => {
    return Object.values(customSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  }, [customSplits]);


  return (
    <>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />}
      <Card className="lg:col-span-3">
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
                      <Input type="number" placeholder="$0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} />
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
                      <Textarea placeholder="e.g. Lunch with colleagues" {...field} />
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
                            <Button asChild variant="outline" className="w-full justify-start text-muted-foreground font-normal">
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

                <Dialog open={isSplitBillOpen} onOpenChange={setSplitBillOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" disabled={!totalAmount || totalAmount <= 0}>
                      <Users className="mr-2 h-4 w-4" />
                       {selectedPeople.length > 0 
                        ? `Split with ${selectedPeople.length} people` 
                        : "Split Bill"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Split Bill</DialogTitle>
                      <DialogDescription>
                        Select people and specify how to split the ${totalAmount.toFixed(2)}.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-40">
                    <div className="space-y-2 py-2 pr-4">
                      {people.length > 0 ? people.map(person => (
                        <div key={person.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent" >
                          <Checkbox
                            id={`person-${person.id}`}
                            checked={selectedPeople.includes(person.id)}
                            onCheckedChange={() => togglePersonSelection(person.id)}
                          />
                          <Label htmlFor={`person-${person.id}`} className="flex-1 cursor-pointer">{person.name}</Label>
                        </div>
                      )) : <p className='text-sm text-muted-foreground text-center'>Add people in the 'People' tab first.</p>}
                    </div>
                    </ScrollArea>
                    {selectedPeople.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                           <div className='flex justify-between items-center'>
                             <h4 className="font-medium">Custom Amounts</h4>
                             <Button variant="secondary" size="sm" onClick={handleSplitEqually}>Split Equally</Button>
                           </div>
                           <ScrollArea className="max-h-48">
                            <div className="space-y-3 pr-4">
                                {selectedPeople.map(personId => {
                                    const person = people.find(p => p.id === personId);
                                    return (
                                        <div key={personId} className="flex items-center gap-3">
                                            <Label htmlFor={`split-${personId}`} className="w-24 truncate">{person?.name}</Label>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                                <Input 
                                                    id={`split-${personId}`} 
                                                    type="number" 
                                                    placeholder="0.00"
                                                    className="pl-6"
                                                    value={customSplits[personId] || ''}
                                                    onChange={(e) => setCustomSplits(prev => ({...prev, [personId]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                           </ScrollArea>
                           <div className='flex justify-between text-sm font-medium p-2 rounded-lg bg-muted/50'>
                                <span>Total Split:</span>
                                <span className={Math.abs(currentSplitTotal - totalAmount) > 0.01 ? 'text-destructive' : 'text-green-500'}>
                                    ${currentSplitTotal.toFixed(2)}
                                </span>
                           </div>
                        </div>
                      </>
                    )}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button>Done</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {selectedPeople.length > 0 && (
                  <div className='flex flex-wrap gap-1 items-center text-sm text-muted-foreground'>
                    Splitting with: {people.filter(p => selectedPeople.includes(p.id)).map(p => <Badge key={p.id} variant="secondary">{p.name}</Badge>)}
                  </div>
                )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
