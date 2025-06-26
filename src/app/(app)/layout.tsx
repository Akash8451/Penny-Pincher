
'use client';
import AppSidebar from '@/components/layout/app-sidebar';
import FloatingActionButton from '@/components/layout/floating-action-button';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';

function MainContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  return (
    <main className={cn(
      "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out h-screen overflow-y-auto pb-20 sm:pb-0",
      isExpanded ? "sm:ml-[220px]" : "sm:ml-[68px]"
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
