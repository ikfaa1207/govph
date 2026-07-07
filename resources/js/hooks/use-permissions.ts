import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage<any>().props;

    const permissions: string[] = auth.user?.permissions || [];
    const roles: string[] = auth.user?.roles || [];

    const hasRole = (role: string | string[]) => {
        const rolesToCheck = Array.isArray(role) ? role : [role];

        return rolesToCheck.some((r) => roles.includes(r));
    };

    const hasPermission = (permission: string | string[]) => {
        const permissionsToCheck = Array.isArray(permission)
            ? permission
            : [permission];

        return permissionsToCheck.some((p) => permissions.includes(p));
    };

    const hasAnyPermission = (permissionsToCheck: string[]) => {
        return permissionsToCheck.some((p) => permissions.includes(p));
    };

    const hasAllPermissions = (permissionsToCheck: string[]) => {
        return permissionsToCheck.every((p) => permissions.includes(p));
    };

    return {
        roles,
        permissions,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}
