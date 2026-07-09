import { usePage } from '@inertiajs/react';
import { Shield, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<any>().props;
    const [time, setTime] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const options: Intl.DateTimeFormatOptions = {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            };
            setTime(new Date().toLocaleString('en-US', options));
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);

        return () => clearInterval(timer);
    }, []);

    // Get user roles
    const userRoles = auth?.user?.roles || [];
    const rawRole = userRoles.length > 0 ? userRoles[0] : 'Employee';
    const primaryRole = rawRole.replace(/[-_]/g, ' ');

    // Color code role badge
    const getRoleBadgeStyles = (role: string) => {
        const normalized = role.toLowerCase();

        if (normalized.includes('admin')) {
            return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400 dark:bg-emerald-500/15';
        }

        if (normalized.includes('officer') || normalized.includes('custodian')) {
            return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25 dark:text-indigo-400 dark:bg-indigo-500/15';
        }

        return 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400 dark:bg-sky-500/15';
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* GovPH Global Agency Header Bar */}
            <div className="hidden md:flex items-center gap-4 text-xs">


                {/* Localized Live Clock */}
                {time && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium border-r border-border pr-4 h-5">
                        <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        <span className="font-mono text-[11px] whitespace-nowrap">{time} PHT</span>
                    </div>
                )}

                {/* Security Clearance Badge */}
                <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border ${getRoleBadgeStyles(primaryRole)}`}>
                        {primaryRole}
                    </Badge>
                </div>
            </div>
        </header>
    );
}
