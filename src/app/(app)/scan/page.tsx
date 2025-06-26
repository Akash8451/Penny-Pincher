
'use client';

import { AppHeader } from '@/components/layout/app-header';
import ScanImportManager from '@/components/scan/scan-import-manager';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScanPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <AppHeader title="Scan & Import" />
      <div className="flex-1 space-y-4 p-4 sm:p-6">
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
