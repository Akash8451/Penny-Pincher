
'use client';

import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format } from 'date-fns';
import type { VaultNote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Lock, Unlock, Eye, EyeOff, Trash2, KeyRound } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function VaultManager() {
  const [notes, setNotes] = useLocalStorage<VaultNote[]>('vault-notes', []);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [decryptedNotes, setDecryptedNotes] = useState<Record<string, string>>({});
  const [isFormOpen, setFormOpen] = useState(false);
  const { toast } = useToast();

  const [isConfirmingPassword, setIsConfirmingPassword] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [onConfirmPasswordSuccess, setOnConfirmPasswordSuccess] = useState<(() => void) | null>(null);

  const handleUnlock = () => {
    if (!password) {
      toast({ variant: 'destructive', title: 'Password required' });
      return;
    }
    setIsUnlocked(true);
    toast({ title: 'Vault Unlocked', description: 'You can now view and manage your notes for this session.' });
  };

  const handleLock = () => {
    setPassword('');
    setIsUnlocked(false);
    setDecryptedNotes({});
    toast({ title: 'Vault Locked' });
  };
  
  const handleSaveNote = (hint: string, content: string) => {
    if (!hint || !content) {
        toast({ variant: 'destructive', title: 'All fields are required.' });
        return;
    }
    const encryptedContent = CryptoJS.AES.encrypt(content, password).toString();
    const newNote: VaultNote = {
        id: `note-${Date.now()}`,
        hint,
        encryptedContent,
        date: new Date().toISOString(),
    };
    setNotes([...notes, newNote]);
    setFormOpen(false);
    toast({ title: 'Note Saved', description: 'Your new note has been securely saved.' });
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    toast({ title: 'Note Deleted' });
  };

  const toggleNoteVisibility = (note: VaultNote) => {
    if (decryptedNotes[note.id]) {
      setDecryptedNotes(prev => {
        const newDecrypted = { ...prev };
        delete newDecrypted[note.id];
        return newDecrypted;
      });
    } else {
        setOnConfirmPasswordSuccess(() => () => {
            try {
                const decryptedBytes = CryptoJS.AES.decrypt(note.encryptedContent, password);
                const decryptedContent = decryptedBytes.toString(CryptoJS.enc.Utf8);
                if (!decryptedContent) throw new Error("Decryption failed");
                
                setDecryptedNotes(prev => ({ ...prev, [note.id]: decryptedContent }));
            } catch (error) {
                toast({ variant: 'destructive', title: 'Decryption Failed', description: 'Check your password and try again.' });
            }
        });
        setIsConfirmingPassword(true);
    }
  };

  const handlePasswordConfirmation = () => {
    if (passwordConfirmation === password) {
      onConfirmPasswordSuccess?.();
      setIsConfirmingPassword(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Incorrect Password',
        description: 'Please try again.',
      });
    }
    setPasswordConfirmation('');
  };


  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Unlock Secure Vault</CardTitle>
          <CardDescription>Enter your vault password to access your encrypted notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="vault-password">Vault Password</Label>
                <Input
                    id="vault-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
            </div>
            <Button onClick={handleUnlock} className="w-full">
                <Unlock className="mr-2 h-4 w-4" /> Unlock
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Your Secure Notes</CardTitle>
            <CardDescription>Notes are end-to-end encrypted. Only you can see them.</CardDescription>
        </div>
        <Button variant="destructive" onClick={handleLock}>
            <Lock className="mr-2 h-4 w-4" /> Lock Vault
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {notes.length > 0 ? (
                notes.map(note => (
                    <div key={note.id} className="p-4 rounded-lg border bg-accent/30 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">{note.hint}</h3>
                                <p className="text-sm text-muted-foreground">Created: {format(new Date(note.date), 'PP')}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" onClick={() => toggleNoteVisibility(note)}>
                                    {decryptedNotes[note.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action is permanent. To delete the note "{note.hint}," you will need to confirm your password.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => {
                                                    setOnConfirmPasswordSuccess(() => () => handleDeleteNote(note.id));
                                                    setIsConfirmingPassword(true);
                                                }}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        {decryptedNotes[note.id] && (
                            <div className="p-3 bg-background rounded-md text-sm whitespace-pre-wrap animate-fade-in-up">
                                {decryptedNotes[note.id]}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Your vault is empty.</p>
                    <p>Add a note to get started.</p>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Note</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Secure Note</DialogTitle>
                    <DialogDescription>
                        This note will be encrypted with your vault password.
                    </DialogDescription>
                </DialogHeader>
                <NoteForm onSave={handleSaveNote} />
            </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>

    <Dialog open={isConfirmingPassword} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setPasswordConfirmation('');
            setOnConfirmPasswordSuccess(null);
        }
        setIsConfirmingPassword(isOpen);
    }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Password</DialogTitle>
                <DialogDescription>
                    For your security, please re-enter your vault password to continue.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="password-confirm" className="sr-only">Password</Label>
                <Input
                    id="password-confirm"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirmation()}
                    placeholder="Enter vault password"
                    autoFocus
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsConfirmingPassword(false)}>Cancel</Button>
                <Button onClick={handlePasswordConfirmation}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}


function NoteForm({ onSave }: { onSave: (hint: string, content: string) => void }) {
    const [hint, setHint] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(hint, content);
        setHint('');
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
                <Label htmlFor="note-hint">Hint (Unencrypted)</Label>
                <Input
                    id="note-hint"
                    value={hint}
                    onChange={e => setHint(e.target.value)}
                    placeholder="e.g., Wi-Fi Password"
                    required
                />
            </div>
            <div>
                <Label htmlFor="note-content">Secure Content (Encrypted)</Label>
                <Textarea
                    id="note-content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter the secret information here..."
                    required
                    rows={5}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button type="submit"><KeyRound className="mr-2 h-4 w-4" /> Encrypt & Save</Button>
            </DialogFooter>
        </form>
    )
}
