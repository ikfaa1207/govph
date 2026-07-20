import { router } from '@inertiajs/react';
import {
    Calculator,
    Package,
    ClipboardList,
    Database,
    FileText,
    Truck,
    ShoppingCart,
    HelpCircle,
    Loader2,
    Ticket,
} from 'lucide-react';
import * as React from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import items from '@/routes/inventory/items';
import properties from '@/routes/inventory/properties';
import requisitions from '@/routes/inventory/requisitions';

export function AppCommandPalette() {
    const { hasPermission } = usePermissions();
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [results, setResults] = React.useState<{
        properties: any[];
        tickets: any[];
    }>({ properties: [], tickets: [] });
    const [isSearching, setIsSearching] = React.useState(false);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => {
                    if (prev) {
                        setSearchQuery('');
                        setResults({ properties: [], tickets: [] });
                    }

                    return !prev;
                });
            }
        };

        document.addEventListener('keydown', down);

        return () => document.removeEventListener('keydown', down);
    }, []);

    React.useEffect(() => {
        if (!open || searchQuery.length < 2) {
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            fetch(`/inventory/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    setResults(data);
                    setIsSearching(false);
                })
                .catch((err) => {
                    console.error('Search failed:', err);
                    setIsSearching(false);
                });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, open]);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);

        if (!newOpen) {
            setSearchQuery('');
            setResults({ properties: [], tickets: [] });
        }
    };

    const handleSearchQueryChange = (val: string) => {
        setSearchQuery(val);

        if (val.length < 2) {
            setResults({ properties: [], tickets: [] });
        }
    };

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        setSearchQuery('');
        setResults({ properties: [], tickets: [] });
        command();
    }, []);

    const hasSearchResults =
        results.properties.length > 0 || results.tickets.length > 0;

    return (
        <CommandDialog open={open} onOpenChange={handleOpenChange}>
            <CommandInput
                placeholder="Search properties, tickets, or modules..."
                value={searchQuery}
                onValueChange={handleSearchQueryChange}
            />
            <CommandList>
                <CommandEmpty>
                    {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Searching...
                            </span>
                        </div>
                    ) : (
                        'No results found.'
                    )}
                </CommandEmpty>

                {results.properties.length > 0 && (
                    <CommandGroup heading="Properties (PPE)">
                        {results.properties.map((prop) => (
                            <CommandItem
                                key={prop.id}
                                onSelect={() =>
                                    runCommand(() =>
                                        router.visit(
                                            properties.index.url() +
                                                `?search=${prop.property_number}`,
                                        ),
                                    )
                                }
                            >
                                <Database className="mr-2 h-4 w-4 text-indigo-500" />
                                <div className="flex flex-col">
                                    <span>{prop.property_number}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {prop.brand} {prop.model}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results.tickets.length > 0 && (
                    <CommandGroup heading="Support Tickets">
                        {results.tickets.map((ticket) => (
                            <CommandItem
                                key={ticket.id}
                                onSelect={() =>
                                    runCommand(() =>
                                        router.visit(
                                            `/inventory/helpdesk?search=${ticket.id}`,
                                        ),
                                    )
                                }
                            >
                                <Ticket className="mr-2 h-4 w-4 text-rose-500" />
                                <div className="flex flex-col">
                                    <span>{ticket.title}</span>
                                    <span className="text-xs text-muted-foreground uppercase">
                                        {ticket.status}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {/* Navigation Group */}
                {(hasPermission('dashboard.view') ||
                    hasPermission('inventory.view') ||
                    hasPermission('property.view') ||
                    hasPermission('request.create') ||
                    hasPermission('request.approve') ||
                    hasPermission('warehouse.issue')) && (
                    <>
                        {hasSearchResults && <CommandSeparator />}
                        <CommandGroup heading="Navigation">
                            {hasPermission('dashboard.view') && (
                                <CommandItem
                                    onSelect={() =>
                                        runCommand(() =>
                                            router.visit(dashboard.url()),
                                        )
                                    }
                                >
                                    <DashboardIcon className="mr-2 h-4 w-4" />
                                    <span>Dashboard</span>
                                </CommandItem>
                            )}
                            {hasPermission('inventory.view') && (
                                <CommandItem
                                    onSelect={() =>
                                        runCommand(() =>
                                            router.visit(items.index.url()),
                                        )
                                    }
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    <span>Supplies Catalog</span>
                                </CommandItem>
                            )}
                            {hasPermission('property.view') && (
                                <CommandItem
                                    onSelect={() =>
                                        runCommand(() =>
                                            router.visit(
                                                properties.index.url(),
                                            ),
                                        )
                                    }
                                >
                                    <Database className="mr-2 h-4 w-4" />
                                    <span>Property Registry (PPE)</span>
                                </CommandItem>
                            )}
                            {(hasPermission('request.create') ||
                                hasPermission('request.approve') ||
                                hasPermission('warehouse.issue')) && (
                                <CommandItem
                                    onSelect={() =>
                                        runCommand(() =>
                                            router.visit(
                                                requisitions.index.url(),
                                            ),
                                        )
                                    }
                                >
                                    <ClipboardList className="mr-2 h-4 w-4" />
                                    <span>Requisitions (RIS)</span>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </>
                )}

                {/* Procurement Group */}
                {(hasPermission('procurement.view') ||
                    hasPermission('warehouse.receive')) && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Procurement & Receiving">
                            {hasPermission('procurement.view') && (
                                <>
                                    <CommandItem
                                        onSelect={() =>
                                            runCommand(() =>
                                                router.visit(
                                                    '/inventory/purchase-requests',
                                                ),
                                            )
                                        }
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>Purchase Requests</span>
                                    </CommandItem>
                                    <CommandItem
                                        onSelect={() =>
                                            runCommand(() =>
                                                router.visit(
                                                    '/inventory/purchase-orders',
                                                ),
                                            )
                                        }
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        <span>Purchase Orders</span>
                                    </CommandItem>
                                </>
                            )}
                            {hasPermission('warehouse.receive') && (
                                <CommandItem
                                    onSelect={() =>
                                        runCommand(() =>
                                            router.visit(
                                                '/inventory/receiving-reports',
                                            ),
                                        )
                                    }
                                >
                                    <Truck className="mr-2 h-4 w-4" />
                                    <span>Receiving (Stock In)</span>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </>
                )}

                {/* Quick Actions Group */}
                <CommandSeparator />
                <CommandGroup heading="Quick Actions">
                    {(hasPermission('reports.view') ||
                        hasPermission('inventory.view') ||
                        hasPermission('warehouse.view')) && (
                        <CommandItem
                            onSelect={() =>
                                runCommand(() =>
                                    router.visit('/inventory/physical-counts'),
                                )
                            }
                        >
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Physical Counts</span>
                        </CommandItem>
                    )}
                    <CommandItem
                        onSelect={() =>
                            runCommand(() =>
                                router.visit('/inventory/helpdesk'),
                            )
                        }
                    >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>System Helpdesk</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    );
}
