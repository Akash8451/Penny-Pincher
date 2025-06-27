'use client';

import { AppHeader } from '@/components/layout/app-header';
import ScanImportManager from '@/components/scan/receipt-scanner';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const maxDuration = 60;

export default function ScanPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <AppHeader title="Scan & Import" />
      <div className="flex-1 space-y-4 p-4">
        {isClient ? (
          <ScanImportManager />
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
