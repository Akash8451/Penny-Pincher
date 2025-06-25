
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ThemeSettings() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <h3 className="font-medium">Theme</h3>
                        <p className="text-sm text-muted-foreground">Select a light or dark theme.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the app.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">Select a light or dark theme.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} size="icon" onClick={() => setTheme('light')}>
                    <Sun />
                </Button>
                 <Button variant={theme === 'dark' ? 'default' : 'outline'} size="icon" onClick={() => setTheme('dark')}>
                    <Moon />
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
