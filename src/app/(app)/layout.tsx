
'use client';
import AppSidebar from '@/components/layout/app-sidebar';
import FloatingActionButton from '@/components/layout/floating-action-button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={cn(
        "flex-1 flex flex-col pb-20 sm:pb-0 animate-fade-in-up transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "sm:ml-[68px]" : "sm:ml-[220px]"
      )}>
        {children}
        <FloatingActionButton />
      </main>
    </div>
  )
}
