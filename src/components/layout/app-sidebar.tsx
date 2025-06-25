
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shapes, Settings, Wallet, Users, List, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: List, label: 'Transactions' },
  { href: '/categories', icon: Shapes, label: 'Categories' },
  { href: '/people', icon: Users, label: 'People' },
];

export default function AppSidebar({ isCollapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "sticky top-0 h-screen left-0 hidden border-r bg-card sm:flex flex-col z-20 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[68px]" : "w-[220px]"
      )}>
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between",
          "p-4 border-b"
        )}>
          <Link href="/dashboard" className={cn(isCollapsed && "hidden")}>
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="font-bold">PennyPincher</span>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle sidebar">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-2">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center h-10 rounded-lg transition-colors relative',
                        isCollapsed ? 'justify-center w-full' : 'px-4 justify-start gap-3',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
                      <item.icon className="h-5 w-5" />
                      <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </nav>

        <div className="mt-auto p-2 border-t">
          <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className={cn(
                        'flex items-center h-10 rounded-lg transition-colors relative',
                        isCollapsed ? 'justify-center w-full' : 'px-4 justify-start gap-3',
                        pathname.startsWith("/settings")
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                  >
                    {pathname.startsWith("/settings") && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
                    <Settings className="h-5 w-5" />
                    <span className={cn(isCollapsed && "sr-only")}>Settings</span>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">Settings</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t border-border/20 z-20 flex items-center justify-around">
         {[...navItems, { href: '/settings', icon: Settings, label: 'Settings' }].map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors hover:text-foreground w-16',
                    pathname.startsWith(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
            </Link>
        ))}
      </nav>
    </>
  );
}
