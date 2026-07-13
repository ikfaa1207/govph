import { Link } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';

export interface RowAction {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    href?: string;
    external?: boolean;
    permission?: string | string[];
    role?: string | string[];
    destructive?: boolean;
    show?: boolean;
}

interface RowActionsMenuProps {
    actions: RowAction[];
}

export function RowActionsMenu({ actions }: RowActionsMenuProps) {
    const { hasPermission, hasRole } = usePermissions();

    // Filter actions based on permissions/roles and explicit conditional show
    const visibleActions = actions.filter((action) => {
        if (action.show === false) {
            return false;
        }

        if (action.permission) {
            return hasPermission(action.permission);
        }

        if (action.role) {
            return hasRole(action.role);
        }

        return true;
    });

    if (visibleActions.length === 0) {
        return null;
    }

    // Separate non-destructive and destructive actions
    const nonDestructive = visibleActions.filter((a) => !a.destructive);
    const destructive = visibleActions.filter((a) => a.destructive);

    const renderItemContent = (action: RowAction, isDestructive = false) => {
        const Icon = action.icon;

        return (
            <>
                <Icon
                    className={`mr-2 h-4 w-4 ${
                        isDestructive ? '' : 'text-muted-foreground'
                    }`}
                    aria-hidden="true"
                />
                <span>{action.label}</span>
            </>
        );
    };

    const renderMenuItem = (
        action: RowAction,
        idx: number,
        isDestructive = false,
    ) => {
        const key = `${action.label}-${idx}`;
        const itemClass = isDestructive
            ? 'cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive'
            : 'cursor-pointer';

        if (action.href) {
            if (action.external) {
                return (
                    <DropdownMenuItem key={key} asChild className={itemClass}>
                        <a
                            href={action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center"
                        >
                            {renderItemContent(action, isDestructive)}
                        </a>
                    </DropdownMenuItem>
                );
            }

            return (
                <DropdownMenuItem key={key} asChild className={itemClass}>
                    <Link
                        href={action.href}
                        className="flex w-full items-center"
                    >
                        {renderItemContent(action, isDestructive)}
                    </Link>
                </DropdownMenuItem>
            );
        }

        return (
            <DropdownMenuItem
                key={key}
                onClick={action.onClick}
                className={itemClass}
            >
                {renderItemContent(action, isDestructive)}
            </DropdownMenuItem>
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {nonDestructive.map((action, idx) =>
                    renderMenuItem(action, idx, false),
                )}
                {destructive.length > 0 && (
                    <>
                        {nonDestructive.length > 0 && <DropdownMenuSeparator />}
                        {destructive.map((action, idx) =>
                            renderMenuItem(action, idx, true),
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
