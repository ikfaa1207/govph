import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatCurrency(
    amount: number | string | null | undefined,
): string {
    if (amount == null) {
        return '₱ 0.00';
    }

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) {
        return '₱ 0.00';
    }

    return (
        '₱ ' +
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num)
    );
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) {
        return '-';
    }

    try {
        return format(new Date(date), 'MMM dd, yyyy hh:mm a');
    } catch {
        return '-';
    }
}
