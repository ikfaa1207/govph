import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2 } from 'lucide-react';
import { LayoutGrid, Package, ClipboardList, Database, FileText, Users, ShieldAlert, Truck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import items from '@/routes/inventory/items';
import properties from '@/routes/inventory/properties';
import reports from '@/routes/inventory/reports';
import requisitions from '@/routes/inventory/requisitions';
import type { NavItem } from '@/types';

interface GimsNavItem extends NavItem {
    permission?: string;
}

const mainNavItems: GimsNavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
        icon: LayoutGrid,
        permission: 'dashboard.view',
    },
    {
        title: 'Supplies Catalog',
        href: items.index.url(),
        icon: Package,
        permission: 'inventory.view',
    },
    {
        title: 'Receiving (Stock In)',
        href: '/inventory/receiving-reports',
        icon: Truck,
        permission: 'warehouse.receive',
    },
    {
        title: 'Requisitions (RIS)',
        href: requisitions.index.url(),
        icon: ClipboardList,
        permission: 'inventory.view',
    },
    {
        title: 'Property Registry (PPE)',
        href: properties.index.url(),
        icon: Database,
        permission: 'property.view',
    },
    {
        title: 'COA Reports',
        href: reports.index.url(),
        icon: FileText,
        permission: 'reports.view',
    },
    {
        title: 'Physical Counts',
        href: '/inventory/physical-counts',
        icon: FileText,
        permission: 'inventory.view',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'COA Regulations',
        href: 'https://www.coa.gov.ph/',
        icon: BookOpen,
    },
    {
        title: 'System Helpdesk',
        href: '/inventory/helpdesk',
        icon: FolderGit2,
    },
];

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const permissions = auth?.user?.permissions || [];

    const filteredNavItems = mainNavItems.filter(item => {
        if (!item.permission) {
            return true;
        }

        return permissions.includes(item.permission);
    });

    if (permissions.includes('users.manage')) {
        filteredNavItems.push({
            title: 'User Management',
            href: '/inventory/admin/users',
            icon: Users,
        });
    }

    if (permissions.includes('roles.manage')) {
        filteredNavItems.push({
            title: 'Roles & Permissions',
            href: '/inventory/admin/roles',
            icon: ShieldAlert,
        });
    }

    const defaultHomeUrl = permissions.includes('dashboard.view') 
        ? dashboard.url() 
        : (filteredNavItems.length > 0 ? filteredNavItems[0].href : '/profile');

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

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
