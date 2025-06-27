
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Person, Expense } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Send, UserPlus } from 'lucide-react';
import { customAlphabet } from 'nanoid';
import { useLocalStorage } from '@/hooks/use-local-storage';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// A function to generate a short, random invoice ID
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);

interface PaymentRequestFormProps {
  onAddRequest: (request: Omit<Expense, 'id'|'date'|'type'|'splitWith'|'categoryId'> & { personId: string }) => void;
  onSuccess: () => void;
}

const requestSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().positive({ message: "Amount must be positive." })
  ),
  personId: z.string().min(1, { message: "Please select a person." }),
  note: z.string().min(1, "A note is required.").max(100, "Note is too long."),
});

export default function PaymentRequestForm({ onAddRequest, onSuccess }: PaymentRequestFormProps) {
  const [people, setPeople] = useLocalStorage<Person[]>('people', []);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { amount: '', personId: '', note: '' },
  });

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const handleAddNewPerson = () => {
    const trimmedName = newPersonName.trim();
    if (!trimmedName) return;

    if (people.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Person already exists',
        });
        return;
    }

    const newPerson: Person = {
        id: `person-${new Date().getTime()}`,
        name: trimmedName,
        tags: [],
    };
    
    setPeople(prev => [...prev, newPerson]);
    form.setValue('personId', newPerson.id);
    setShowAddPerson(false);
    setNewPersonName('');
    toast({ title: `Added "${trimmedName}"`, description: 'They have been selected for the request.' });
  };

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    const invoiceId = `inv_${nanoid()}`;
    const finalNote = `[${invoiceId}] ${values.note}`;
    
    onAddRequest({
        ...values,
        amount: values.amount!,
        note: finalNote,
    });
    form.reset();
    onSuccess();
  };

  return (
    <div className='space-y-2'>
        <div className="text-center">
            <h3 className="text-lg font-medium">Request Payment</h3>
            <p className="text-sm text-muted-foreground">Create and send a payment request.</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
               <FormField
                control={form.control}
                name="personId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Bill To</FormLabel>
                      <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setShowAddPerson(prev => !prev)}>
                        {showAddPerson ? 'Cancel' : 'Add New Person'}
                      </Button>
                    </div>
                    {showAddPerson ? (
                       <div className="flex items-center gap-2">
                        <Input
                          placeholder="New person's name"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                        />
                        <Button type="button" variant="secondary" onClick={handleAddNewPerson} disabled={!newPersonName.trim()}>
                          <UserPlus />
                        </Button>
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a person" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {people.length > 0 ? (
                           people.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))
                        ) : (
                            <div className='p-4 text-sm text-muted-foreground'>No people found.</div>
                        )}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Items</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Web design services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || people.length === 0}>
                    <Send className="mr-2 h-4 w-4" /> Send Request
                </Button>
              </div>
            </form>
          </Form>
    </div>
  );
}
