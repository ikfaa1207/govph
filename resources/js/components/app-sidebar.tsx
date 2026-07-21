import { Link, usePage } from '@inertiajs/react';
import { FolderGit2 } from 'lucide-react';
import {
    LayoutGrid,
    Package,
    ClipboardList,
    Database,
    FileText,
    Users,
    ShieldAlert,
    Truck,
    ShoppingCart,
    FileBox,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard, helpdesk } from '@/routes';
import inventory from '@/routes/inventory';

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const permissions = auth?.user?.permissions || [];
    const { isCurrentUrl } = useCurrentUrl();

    const filterItem = (item: {
        href: string;
        permission?: string | string[];
    }) => {
        if (!item.permission) {
            return true;
        }

        if (item.href === inventory.physicalCounts.index.url()) {
            return (
                permissions.includes('reports.view') ||
                !!auth?.user?.has_physical_counts
            );
        }

        if (Array.isArray(item.permission)) {
            return item.permission.some((p) => permissions.includes(p));
        }

        return permissions.includes(item.permission);
    };

    // 1. Overview Group
    const overviewItems = [
        {
            title: 'Dashboard',
            href: dashboard.url(),
            icon: LayoutGrid,
            permission: 'dashboard.view',
        },
        {
            title: 'Supplies Catalog',
            href: inventory.items.index.url(),
            icon: Package,
            permission: 'inventory.view',
        },
    ].filter(filterItem);

    // 2. Operations Group
    const operationsItems = [
        {
            title: 'Purchase Requests',
            href: inventory.purchaseRequests.index.url(),
            icon: FileBox,
            permission: 'procurement.view',
        },
        {
            title: 'Purchase Orders',
            href: inventory.purchaseOrders.index.url(),
            icon: ShoppingCart,
            permission: 'procurement.view',
        },
        {
            title: 'Receiving (Stock In)',
            href: inventory.receiving.index.url(),
            icon: Truck,
            permission: 'warehouse.receive',
        },
        {
            title: 'Requisitions (RIS)',
            href: inventory.requisitions.index.url(),
            icon: ClipboardList,
            permission: [
                'request.create',
                'request.approve',
                'warehouse.issue',
            ],
        },
    ].filter(filterItem);

    // 3. Assets & Audits Group
    const assetItems = [
        {
            title: 'Property Registry',
            href: inventory.properties.index.url(),
            icon: Database,
            permission: 'property.view',
        },
        {
            title: 'COA Reports',
            href: inventory.reports.index.url(),
            icon: FileText,
            permission: 'reports.view',
        },
        {
            title: 'Physical Counts',
            href: inventory.physicalCounts.index.url(),
            icon: ClipboardList,
            permission: ['reports.view', 'inventory.view', 'warehouse.view'],
        },
    ].filter(filterItem);

    // 4. Administration Group
    const adminItems = [];

    if (permissions.includes('users.manage')) {
        adminItems.push({
            title: 'System Libraries',
            href: inventory.masterData.index.url(),
            icon: Database,
        });
        adminItems.push({
            title: 'User Management',
            href: inventory.admin.users.index.url(),
            icon: Users,
        });
    }

    if (permissions.includes('roles.manage')) {
        adminItems.push({
            title: 'Roles & Permissions',
            href: inventory.admin.roles.index.url(),
            icon: ShieldAlert,
        });
    }

    // 5. Helpdesk
    const helpItems = [
        {
            title: 'System Helpdesk',
            href: helpdesk.url(),
            icon: FolderGit2,
        },
    ];

    const defaultHomeUrl = permissions.includes('dashboard.view')
        ? dashboard.url()
        : overviewItems.length > 0
          ? overviewItems[0].href
          : '/profile';

    const renderSidebarGroup = (label: string, items: Array<any>) => {
        if (items.length === 0) {
            return null;
        }

        return (
            <SidebarGroup className="px-2 py-0.5">
                <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/75 uppercase">
                    {label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={defaultHomeUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="space-y-3 py-2">
                {renderSidebarGroup('Overview', overviewItems)}
                {renderSidebarGroup('Operations', operationsItems)}
                {renderSidebarGroup('Assets & Audits', assetItems)}
                {renderSidebarGroup('Administration', adminItems)}
                {renderSidebarGroup('System & Support', helpItems)}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
