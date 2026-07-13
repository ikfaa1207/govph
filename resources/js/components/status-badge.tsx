import {
    Check,
    Clock,
    AlertTriangle,
    Trash2,
    RefreshCw,
    User,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';

export type StatusVariant =
    'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'indigo';

interface StatusBadgeProps {
    value: string;
    variant?: StatusVariant;
    label?: string;
}

export function StatusBadge({ value, variant, label }: StatusBadgeProps) {
    const resolvedLabel = label || value.replace(/_/g, ' ');
    let resolvedVariant: StatusVariant = variant || 'neutral';
    let Icon: React.ComponentType<{ className?: string }> | null = null;

    const normalized = value.toLowerCase();

    if (!variant) {
        if (
            [
                'available',
                'active',
                'approved',
                'finalized',
                'good',
                'new',
                'success',
            ].includes(normalized)
        ) {
            resolvedVariant = 'success';
            Icon = Check;
        } else if (
            ['assigned', 'issued', 'open', 'info'].includes(normalized)
        ) {
            resolvedVariant = 'info';
            Icon = User;
        } else if (['transferred', 'ptr'].includes(normalized)) {
            resolvedVariant = 'indigo';
            Icon = RefreshCw;
        } else if (
            [
                'pending',
                'pending_review',
                'pending_approval',
                'review',
                'warning',
            ].includes(normalized)
        ) {
            resolvedVariant = 'warning';
            Icon = Clock;
        } else if (
            [
                'disposed',
                'rejected',
                'danger',
                'unserviceable',
                'needs_repair',
            ].includes(normalized)
        ) {
            resolvedVariant = 'danger';
            Icon = normalized === 'disposed' ? Trash2 : AlertTriangle;
        }
    }

    const variantStyles = {
        success:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30',
        info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30',
        warning:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30',
        danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/30',
        neutral:
            'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-400 dark:border-neutral-800/50',
    };

    return (
        <Badge
            variant="outline"
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium capitalize ${variantStyles[resolvedVariant]}`}
        >
            {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
            <span>{resolvedLabel}</span>
        </Badge>
    );
}
