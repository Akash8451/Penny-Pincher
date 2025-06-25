
'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Person } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function PersonForm({
  person,
  onSave,
}: {
  person?: Person | null;
  onSave: (person: Omit<Person, 'id'>) => void;
}) {
  const [name, setName] = useState(person?.name || '');
  const [tags, setTags] = useState((person?.tags || []).join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSave({ 
        name, 
        tags: tags.split(',').map(t => t.trim()).filter(Boolean) 
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Person's Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., College Friend, Roommate" />
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
        <Button type="submit">Save Person</Button>
      </DialogFooter>
    </form>
  );
}

export default function PeopleManager() {
  const [people, setPeople] = useLocalStorage<Person[]>('people', []);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const { toast } = useToast();

  const handleSave = (personData: Omit<Person, 'id'>) => {
    if (editingPerson) {
      setPeople(people.map((p) => (p.id === editingPerson.id ? { ...p, ...personData } : p)));
      toast({ title: `✔ Updated ${personData.name}` });
    } else {
      setPeople([...people, { id: `person-${new Date().getTime()}`, ...personData }]);
      toast({ title: `✔ Added ${personData.name}` });
    }
    setEditingPerson(null);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPeople(people.filter((p) => p.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your People</CardTitle>
        <CardDescription>Manage contacts for splitting bills and tracking shared expenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {people.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map((person) => (
                <div key={person.id} className="flex flex-col p-4 rounded-lg bg-accent/50 gap-2">
                    <div className="flex items-center">
                        <span className="flex-1 font-medium">{person.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                            setEditingPerson(person);
                            setDialogOpen(true);
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete this person from your contacts.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(person.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    {person.tags && person.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {person.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                    )}
                </div>
            ))}
            </div>
        ) : (
             <div className="text-center text-muted-foreground py-10">
                You haven't added anyone yet.
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setEditingPerson(null);
            setDialogOpen(isOpen);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPerson(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPerson ? 'Edit Person' : 'Add a New Person'}</DialogTitle>
              <DialogDescription>
                Fill in the details for your contact below.
              </DialogDescription>
            </DialogHeader>
            <PersonForm
              person={editingPerson}
              onSave={handleSave}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
