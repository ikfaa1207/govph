import { DicebearAvatar } from '@/components/dicebear-avatar';

import type { User } from '@/types';

function formatRole(role: string): string {
    return role
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function UserInfo({
    user,
    showEmail = false,
    showRole = false,
}: {
    user: User;
    showEmail?: boolean;
    showRole?: boolean;
}) {
    const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;

    return (
        <>
            <DicebearAvatar 
                seed={user.name} 
                className="h-8 w-8 overflow-hidden rounded-full border border-neutral-200 dark:border-neutral-700" 
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showRole && primaryRole && (
                    <span className="truncate text-xs text-muted-foreground">
                        {formatRole(primaryRole)}
                    </span>
                )}
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
