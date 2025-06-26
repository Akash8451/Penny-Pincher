'use client';
import AppSidebar from '@/components/layout/app-sidebar';
import FloatingActionButton from '@/components/layout/floating-action-button';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/contexts/sidebar-context';

function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className={cn(
      "flex-1 flex flex-col pb-20 sm:pb-0"
    )}>
      {children}
    </main>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <MainContent>
          {children}
          <FloatingActionButton />
        </MainContent>
      </div>
    </SidebarProvider>
  )
}
