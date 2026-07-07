import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface CanProps {
    permission?: string | string[];
    role?: string | string[];
    matchAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function Can({
    permission,
    role,
    matchAll = false,
    fallback = null,
    children,
}: CanProps) {
    const { hasPermission, hasAllPermissions, hasRole } = usePermissions();

    let hasAccess = false;

    if (permission) {
        if (matchAll && Array.isArray(permission)) {
            hasAccess = hasAllPermissions(permission);
        } else {
            hasAccess = hasPermission(permission);
        }
    } else if (role) {
        // matchAll for roles could be implemented if needed, but for now we'll stick to any match
        hasAccess = hasRole(role);
    } else {
        // If no permission or role is specified, we default to rendering children.
        hasAccess = true;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
