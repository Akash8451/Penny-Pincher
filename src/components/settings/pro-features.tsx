
'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, KeyRound, PartyPopper } from 'lucide-react';

const PRO_PIN = '2024';

export default function ProFeatures() {
  const [isClient, setIsClient] = useState(false);
  const [isUnlocked, setUnlocked] = useLocalStorage('pro-features-unlocked', false);
  const [pin, setPin] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUnlock = () => {
    if (pin === PRO_PIN) {
      setUnlocked(true);
      toast({
        title: 'Pro Features Unlocked!',
        description: 'You now have access to the notes vault and more.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Incorrect PIN',
        description: 'Please try again.',
      });
    }
    setPin('');
  };

  if (!isClient) {
    return null; // Or a skeleton loader
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Pro Features
        </CardTitle>
        <CardDescription>
          {isUnlocked
            ? "You have access to all professional features."
            : "Unlock advanced features like an encrypted notes vault."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUnlocked ? (
          <div className="flex items-center justify-center p-4 rounded-lg bg-accent/50 text-center text-accent-foreground">
            <PartyPopper className="mr-3 h-6 w-6 text-green-500" />
            <p className="font-medium">All Pro features are now active!</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="pin-input">Enter PIN</Label>
              <Input
                id="pin-input"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
              />
            </div>
            <Button onClick={handleUnlock} className="w-full sm:w-auto">
              <KeyRound className="mr-2 h-4 w-4" />
              Unlock
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
