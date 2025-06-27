
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Wallet, List, ChevronLeft, ChevronRight, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/sidebar-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isExpanded, setIsPinned } = useSidebar();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: List, label: 'Transactions' },
    { href: '/scan', icon: ScanLine, label: 'Scan & Import' },
  ];
  
  const mobileNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: List, label: 'Transactions' },
    { href: '/scan', icon: ScanLine, label: 'Scan' },
    { href: '/settings', icon: Settings, label: 'Settings' }
  ];


  const handleTogglePin = () => {
    setIsPinned(!isExpanded);
  }

  return (
    <>
      {/* Desktop Sidebar */}
        <TooltipProvider delayDuration={0}>
            <aside 
            className={cn(
                "fixed top-0 h-screen left-0 hidden border-r bg-card sm:flex flex-col z-40 transition-all duration-200 ease-in-out",
                isExpanded ? "w-[220px]" : "w-[68px]"
            )}
            >
            <div className={cn(
                "flex h-16 items-center border-b px-4",
                isExpanded ? "justify-between" : "justify-center"
            )}>
                <Link href="/dashboard" className={cn("flex items-center gap-2", !isExpanded && "hidden")}>
                <div className="flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    <span className="font-bold">PennyPincher</span>
                </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleTogglePin} aria-label="Toggle sidebar">
                {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
            </div>
            
            <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                            <Link
                            href={item.href}
                            className={cn(
                                'flex items-center h-10 rounded-lg transition-colors relative',
                                !isExpanded ? 'justify-center w-full' : 'px-4 justify-start gap-3',
                                isActive
                                ? 'bg-primary/20 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                            >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
                            <item.icon className="h-5 w-5" />
                            <span className={cn("truncate", !isExpanded && "sr-only")}>{item.label}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {item.label}
                        </TooltipContent>
                    </Tooltip>
                )
                })}
            </nav>

            <div className="mt-auto p-2 border-t">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                        href="/settings"
                        className={cn(
                            'flex items-center h-10 rounded-lg transition-colors relative',
                            !isExpanded ? 'justify-center w-full' : 'px-4 justify-start gap-3',
                            pathname.startsWith("/settings")
                                ? 'bg-primary/20 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                        {pathname.startsWith("/settings") && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>}
                        <Settings className="h-5 w-5" />
                        <span className={cn(!isExpanded && "sr-only")}>Settings</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        Settings
                    </TooltipContent>
                </Tooltip>
            </div>
            </aside>
        </TooltipProvider>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t border-border/20 z-20 grid grid-cols-4 items-center justify-around">
         {mobileNavItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors hover:text-foreground w-full h-full',
                    pathname.startsWith(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center truncate">{item.label}</span>
            </Link>
        ))}
      </nav>
    </>
  );
}
