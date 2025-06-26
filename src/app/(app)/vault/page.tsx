
'use client';

import { AppHeader } from '@/components/layout/app-header';
import VaultManager from '@/components/vault/vault-manager';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function VaultSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>
    );
}

export default function VaultPage() {
  const [isClient, setIsClient] = useState(false);
  const [isProUnlocked] = useLocalStorage('pro-features-unlocked', false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (isClient && !isProUnlocked) {
      router.replace('/settings');
    }
  }, [isClient, isProUnlocked, router]);

  if (!isClient) {
      return (
          <>
            <AppHeader title="Vault">
              <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
            </AppHeader>
            <div className="flex-1 space-y-4 p-4 sm:p-6">
                <VaultSkeleton />
            </div>
          </>
      );
  }

  if (!isProUnlocked) {
    return (
        <>
            <AppHeader title="Access Denied">
              <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
              </Button>
            </AppHeader>
            <div className="flex-1 p-4 sm:p-6">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                           <ShieldAlert className="h-6 w-6 text-destructive" /> Access Denied
                        </CardTitle>
                        <CardDescription>
                           This is a Pro feature. Please unlock Pro features in the settings to access the Vault.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
  }

  return (
    <>
      <AppHeader title="Secure Vault">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
        </Button>
      </AppHeader>
      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <VaultManager />
      </div>
    </>
  );
}
