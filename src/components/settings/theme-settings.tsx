
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ThemeSettings() {
  const { setTheme, theme, resolvedTheme } = useTheme();
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
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  const currentTheme = theme === 'system' ? resolvedTheme : theme;

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
                <p className="text-sm text-muted-foreground">Select a theme or sync with your system.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-md bg-muted p-1">
                    <Button variant={currentTheme === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('light')}>
                        <Sun className="h-4 w-4" />
                        <span className='ml-2'>Light</span>
                    </Button>
                    <Button variant={currentTheme === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>
                        <Moon className="h-4 w-4" />
                        <span className='ml-2'>Dark</span>
                    </Button>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="system-theme"
                        checked={theme === 'system'}
                        onCheckedChange={(checked) => setTheme(checked ? 'system' : (resolvedTheme || 'light'))}
                    />
                    <Label htmlFor="system-theme" className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                    </Label>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
