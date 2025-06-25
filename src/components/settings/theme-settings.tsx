
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Monitor, Contrast } from 'lucide-react';
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
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  const themeButtons = [
    { name: 'light', label: 'Light', icon: Sun },
    { name: 'dark', label: 'Dark', icon: Moon },
    { name: 'dark-contrast', label: 'Contrast', icon: Contrast },
    { name: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the app.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center">
            <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">Select a theme or sync with your system.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-md bg-muted p-1">
                {themeButtons.map((btn) => {
                    const Icon = btn.icon;
                    return (
                        <Button
                            key={btn.name}
                            variant={theme === btn.name ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme(btn.name)}
                        >
                            <Icon className="h-4 w-4" />
                            <span className='ml-2'>{btn.label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
