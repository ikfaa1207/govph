import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
                {description}
            </p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
