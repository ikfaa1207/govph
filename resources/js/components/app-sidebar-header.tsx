import { usePage } from '@inertiajs/react';
import { Shield, Clock, Search } from 'lucide-react';
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

    // Config code role badge with colors and glows
    const getRoleConfig = (role: string) => {
        const normalized = role.toLowerCase();

        if (normalized.includes('admin')) {
            return {
                bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
                text: 'text-emerald-700 dark:text-emerald-400',
                border: 'border-emerald-500/30 dark:border-emerald-500/40',
                glow: 'shadow-[0_0_12px_rgba(16,185,129,0.12)] dark:shadow-[0_0_15px_rgba(52,211,153,0.08)]',
                iconColor: 'text-emerald-500',
            };
        }

        if (
            normalized.includes('officer') ||
            normalized.includes('custodian')
        ) {
            return {
                bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
                text: 'text-indigo-700 dark:text-indigo-400',
                border: 'border-indigo-500/30 dark:border-indigo-500/40',
                glow: 'shadow-[0_0_12px_rgba(99,102,241,0.12)] dark:shadow-[0_0_15px_rgba(129,140,248,0.08)]',
                iconColor: 'text-indigo-500',
            };
        }

        if (normalized.includes('auditor')) {
            return {
                bg: 'bg-rose-500/10 dark:bg-rose-500/15',
                text: 'text-rose-700 dark:text-rose-400',
                border: 'border-rose-500/30 dark:border-rose-500/40',
                glow: 'shadow-[0_0_12px_rgba(244,63,94,0.12)] dark:shadow-[0_0_15px_rgba(251,113,133,0.08)]',
                iconColor: 'text-rose-500',
            };
        }

        return {
            bg: 'bg-sky-500/10 dark:bg-sky-500/15',
            text: 'text-sky-700 dark:text-sky-400',
            border: 'border-sky-500/30 dark:border-sky-500/40',
            glow: 'shadow-[0_0_12px_rgba(14,165,233,0.12)] dark:shadow-[0_0_15px_rgba(56,189,248,0.08)]',
            iconColor: 'text-sky-500',
        };
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* GovPH Global Agency Header Bar */}
            <div className="hidden items-center gap-3 md:flex">
                <button
                    onClick={() =>
                        document.dispatchEvent(
                            new KeyboardEvent('keydown', {
                                key: 'k',
                                metaKey: true,
                            }),
                        )
                    }
                    className="flex h-8 items-center gap-2 rounded-full border border-input bg-muted/40 px-3.5 text-xs text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search GIMS...</span>
                    <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>

                {/* Localized Live Clock */}
                {time && (
                    <div className="flex h-8 items-center gap-2 rounded-full border border-border bg-muted/20 px-3.5 py-1 pr-4 shadow-sm backdrop-blur-xs">
                        <div className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span className="font-mono text-[11px] font-semibold tracking-tight text-foreground/80">
                            {time}
                        </span>
                        <span className="rounded bg-neutral-200/60 px-1 py-0.5 font-mono text-[9px] font-bold text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-400 uppercase">
                            PHT
                        </span>
                    </div>
                )}

                {/* Security Clearance Badge */}
                {(() => {
                    const config = getRoleConfig(primaryRole);
                    return (
                        <div className={`flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-bold tracking-wide transition-all hover:scale-[1.02] ${config.bg} ${config.text} ${config.border} ${config.glow}`}>
                            <Shield className={`h-3.5 w-3.5 shrink-0 ${config.iconColor}`} />
                            <span className="uppercase text-[9px] font-extrabold opacity-60">
                                Clearance:
                            </span>
                            <span>{primaryRole}</span>
                        </div>
                    );
                })()}
            </div>
        </header>
    );
}
