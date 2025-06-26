
'use client';

import Link from 'next/link';
import DataManagement from "@/components/settings/data-management";
import ProFeatures from "@/components/settings/pro-features";
import RegionalSettings from "@/components/settings/regional-settings";
import ThemeSettings from "@/components/settings/theme-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Shapes, Users, Wand2, Lock, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const otherFeatures = [
    { href: '/assistant', icon: Wand2, label: 'AI Assistant', description: 'Ask questions about your finances.' },
    { href: '/categories', icon: Shapes, label: 'Categories', description: 'Manage your spending categories.' },
    { href: '/people', icon: Users, label: 'People', description: 'Manage contacts for bill splitting.' },
    { href: '/vault', icon: Lock, label: 'Secure Vault', description: 'Store sensitive notes securely.', pro: true },
];


export default function SettingsPage() {
  const [isProUnlocked] = useLocalStorage('pro-features-unlocked', false);
  
  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThemeSettings />
          <RegionalSettings />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>App Features</CardTitle>
                <CardDescription>Navigate to other app features and tools.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherFeatures.map((feature) => {
                    if (feature.pro && !isProUnlocked) return null;
                    return (
                         <Link key={feature.href} href={feature.href} passHref>
                            <Button asChild variant="outline" className="h-auto w-full justify-between p-4 items-start text-left flex-col md:flex-row md:items-center">
                               <div className="flex items-center gap-4">
                                   <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
                                   <div>
                                       <p className="font-semibold">{feature.label}</p>
                                       <p className="text-sm text-muted-foreground">{feature.description}</p>
                                   </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground mt-2 md:mt-0" />
                            </Button>
                        </Link>
                    );
                })}
            </CardContent>
        </Card>
        
        <DataManagement />
        <ProFeatures />
      </div>
    </>
  );
}
