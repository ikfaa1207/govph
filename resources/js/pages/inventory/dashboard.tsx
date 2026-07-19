import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    AlertTriangle,
    ClipboardList,
    TrendingDown,
    ArrowDownLeft,
    ArrowUpRight,
    Package,
    Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface DashboardProps {
    userScope: 'global' | 'dept_head' | 'employee' | 'unassigned';
    stats: {
        inventoryType: string;
        totalItems: number;
        lowStocks: number;
        outOfStocks: number;
        totalValue: number;
        totalProperties: number;
        totalPpeValue?: number;
        pendingRequests: number;
        pendingCounts: number;
    };
    recentIssuances: Array<any>;
    recentReceiving: Array<any>;
    pendingRequests: Array<any>;
    complianceAlerts?: Array<{ type: string; title: string; message: string }>;
    myProperties?: Array<any>;
}

export default function Dashboard({
    userScope,
    stats,
    recentIssuances,
    recentReceiving,
    pendingRequests,
    complianceAlerts = [],
    myProperties = [],
}: DashboardProps) {
    const breadcrumbs = [{ title: 'GIMS Dashboard', href: '/dashboard' }];
    setLayoutProps({ breadcrumbs });

    if (userScope === 'unassigned') {
        return (
            <>
                <Head title="GIMS - Unassigned Account" />
                <div className="flex min-h-[60vh] items-center justify-center p-6">
                    <Card className="max-w-md border-amber-200/60 bg-amber-50/20 text-center dark:border-amber-900/30 dark:bg-amber-950/10">
                        <CardHeader className="flex flex-col items-center">
                            <div className="mb-2 rounded-full bg-amber-500/10 p-4 text-amber-500">
                                <AlertTriangle className="h-10 w-10" />
                            </div>
                            <CardTitle className="text-xl font-bold">
                                Employee Profile Needed
                            </CardTitle>
                            <CardDescription>
                                Your user account is not associated with an
                                Employee profile.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                To browse the supplies catalog, submit
                                requisitions (RIS), or manage physical count
                                tasks, your account must be linked to a valid
                                employee profile.
                            </p>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                Please contact your System Administrator or HR
                                Officer to complete your setup.
                            </p>
                            <div className="pt-2">
                                <Link
                                    href="/profile"
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    View Account Settings
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="GIMS - Government Inventory Management System" />
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Government Inventory Management System (GIMS)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {userScope === 'employee'
                                ? 'Personal equipment and requisition workspace.'
                                : 'COA-compliant asset tracking, supplies monitoring, and property accountability desk.'}
                        </p>
                    </div>
                </div>

                {complianceAlerts.length > 0 && (
                    <div className="space-y-4">
                        {complianceAlerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200"
                            >
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <h5 className="text-sm font-semibold">
                                        {alert.title}
                                    </h5>
                                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Metrics Cards Grid */}
                <div
                    className={`grid gap-4 ${
                        userScope === 'employee'
                            ? 'md:grid-cols-3'
                            : userScope === 'dept_head'
                              ? 'md:grid-cols-2 lg:grid-cols-4'
                              : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                    }`}
                >
                    {/* Metrics 1: Total Stock Value (Hidden for regular employees) */}
                    {userScope !== 'employee' && (
                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-emerald-500 bg-card bg-linear-to-tr from-transparent to-emerald-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                                <TrendingDown
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-emerald-500 uppercase">
                                    {stats.inventoryType} Value
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {formatCurrency(stats.totalValue)}
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Metrics 2: Total Items Cataloged */}
                    <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-blue-500 bg-card bg-linear-to-tr from-transparent to-blue-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="absolute -right-4 -bottom-4 text-blue-500/5">
                            <Package className="h-28 w-28" strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[11px] font-medium tracking-wider text-blue-500 uppercase">
                                {userScope === 'employee'
                                    ? 'Supplies Catalog'
                                    : `${stats.inventoryType} Catalog`}
                            </p>
                            <p className="truncate text-2xl font-bold text-foreground">
                                {stats.totalItems} Items
                            </p>
                        </div>
                    </Card>

                    {/* Metrics 3: PPE Property Registry */}
                    <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-violet-500 bg-card bg-linear-to-tr from-transparent to-violet-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="absolute -right-4 -bottom-4 text-violet-500/5">
                            <Database className="h-28 w-28" strokeWidth={1.5} />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[11px] font-medium tracking-wider text-violet-500 uppercase">
                                {userScope === 'employee'
                                    ? 'My Assigned Assets'
                                    : 'Accountable Property'}
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {userScope === 'employee'
                                        ? `${stats.totalProperties} Assets`
                                        : stats.totalPpeValue !== undefined
                                          ? formatCurrency(stats.totalPpeValue)
                                          : `${stats.totalProperties} Assets`}
                                </p>
                                {userScope !== 'employee' &&
                                    stats.totalPpeValue !== undefined && (
                                        <Badge
                                            variant="outline"
                                            className="mb-1 border-violet-500/20 bg-violet-500/10 px-1.5 py-0 text-[10px] whitespace-nowrap text-violet-600"
                                        >
                                            {stats.totalProperties} Assets
                                        </Badge>
                                    )}
                            </div>
                        </div>
                    </Card>

                    {/* Metrics 4: Pending Requisitions */}
                    <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-amber-500 bg-card bg-linear-to-tr from-transparent to-amber-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="absolute -right-4 -bottom-4 text-amber-500/5">
                            <ClipboardList
                                className={`h-28 w-28 ${stats.pendingRequests > 0 ? 'animate-pulse' : ''}`}
                                strokeWidth={1.5}
                            />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[11px] font-medium tracking-wider text-amber-500 uppercase">
                                {userScope === 'employee'
                                    ? 'My Pending RIS'
                                    : 'Pending RIS Requests'}
                            </p>
                            <p className="truncate text-2xl font-bold text-foreground">
                                {stats.pendingRequests} Requisitions
                            </p>
                        </div>
                    </Card>

                    {/* Metrics 5: Pending Physical Counts (Hidden for employees & department heads) */}
                    {userScope === 'global' && (
                        <Link
                            href="/inventory/physical-counts?status=draft"
                            className="relative z-0 block flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-rose-500 bg-card bg-linear-to-tr from-transparent to-rose-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[4px] hover:shadow-lg focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:outline-hidden"
                        >
                            <div className="absolute -right-4 -bottom-4 text-rose-500/5 transition-transform duration-300 hover:scale-110">
                                <ClipboardList
                                    className={`h-28 w-28 ${stats.pendingCounts > 0 ? 'animate-pulse text-rose-500/10' : ''}`}
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="flex items-center justify-between text-[11px] font-medium tracking-wider text-rose-500 uppercase">
                                    <span>Items to Count</span>
                                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-500">
                                        Action Needed
                                    </span>
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground transition-colors group-hover:text-rose-600">
                                    {stats.pendingCounts} Pending Counts
                                </p>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Stock Warning Banners (Hidden for employees) */}
                {userScope !== 'employee' &&
                    (stats.lowStocks > 0 || stats.outOfStocks > 0) && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {stats.lowStocks > 0 && (
                                <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <div>
                                        <span className="font-semibold">
                                            {stats.lowStocks} supplies are below
                                            reorder level.
                                        </span>{' '}
                                        Consider starting a new Purchase Request
                                        (PR).
                                    </div>
                                </div>
                            )}
                            {stats.outOfStocks > 0 && (
                                <div className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <div>
                                        <span className="font-semibold">
                                            {stats.outOfStocks} supplies are
                                            completely out of stock.
                                        </span>{' '}
                                        Requisitions cannot be issued.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                {/* Feed Tables */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Left Column: Requisitions List */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <ClipboardList className="h-4 w-4 text-amber-500" />
                                {userScope === 'employee'
                                    ? 'My Requisition Tickets (RIS)'
                                    : 'Requisitions Dashboard (RIS)'}
                            </CardTitle>
                            <CardDescription>
                                {userScope === 'employee'
                                    ? 'Your recently submitted Requisition & Issue Slips.'
                                    : 'Recent Requisition & Issue Slips submitted by personnel.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    RIS Number
                                                </TableHead>
                                                <TableHead>Requester</TableHead>
                                                <TableHead className="text-center">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Date
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="py-6 text-center text-sm text-muted-foreground"
                                                >
                                                    No pending requisitions at
                                                    the moment.
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    RIS Number
                                                </TableHead>
                                                <TableHead>Requester</TableHead>
                                                <TableHead className="text-center">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Date
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell className="font-mono font-medium text-primary">
                                                        <Link
                                                            href="/inventory/requisitions"
                                                            className="hover:underline"
                                                        >
                                                            {req.ris_number.split(
                                                                '-',
                                                            )[0] + '-...'}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            {
                                                                req.requester
                                                                    ?.name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                req.requester
                                                                    ?.department
                                                                    ?.name
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="capitalize"
                                                        >
                                                            {req.status.replace(
                                                                /_/g,
                                                                ' ',
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {formatDateTime(
                                                            req.created_at,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column: Dynamic depending on role */}
                    <div className="space-y-6">
                        {userScope === 'employee' ? (
                            /* Personal Assigned Assets Card for regular employees */
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Database className="h-4 w-4 text-violet-500" />
                                        My Assigned Assets (PPE)
                                    </CardTitle>
                                    <CardDescription>
                                        Government equipment currently issued to
                                        you.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {myProperties.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            No accountable assets currently
                                            assigned to you.
                                        </div>
                                    ) : (
                                        myProperties.map((prop) => (
                                            <div
                                                key={prop.id}
                                                className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                                            >
                                                <div>
                                                    <div className="font-mono text-xs font-semibold text-primary">
                                                        {prop.property_number}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {prop.brand}{' '}
                                                        {prop.model} (
                                                        {prop.category?.name})
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-medium">
                                                        {formatCurrency(
                                                            prop.unit_cost,
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground capitalize">
                                                        {prop.condition}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            /* Central Supply Feeds for Global / Dept Head roles */
                            <>
                                {/* Quick Issuances feed */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                            {userScope === 'dept_head'
                                                ? 'Department Issuances'
                                                : 'Recent Stock Issuances'}
                                        </CardTitle>
                                        <CardDescription>
                                            Latest supplies issued out of
                                            storage.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {recentIssuances.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                No recent stock issuances.
                                            </div>
                                        ) : (
                                            recentIssuances.map((iss) => (
                                                <div
                                                    key={iss.id}
                                                    className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                                                >
                                                    <div>
                                                        <div className="font-mono text-xs font-semibold text-primary">
                                                            {iss.issue_number}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            To:{' '}
                                                            {iss.receiver?.name}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-medium">
                                                            {iss.issued_date}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            by{' '}
                                                            {iss.issuer?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Recent Deliveries (Only visible for global view) */}
                                {userScope === 'global' && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                                <ArrowDownLeft className="h-4 w-4 text-sky-500" />
                                                Recent Deliveries (IAR)
                                            </CardTitle>
                                            <CardDescription>
                                                Latest deliveries accepted by
                                                the supply unit.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {recentReceiving.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    No recent deliveries
                                                    recorded.
                                                </div>
                                            ) : (
                                                recentReceiving.map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                                                    >
                                                        <div>
                                                            <div className="font-mono text-xs font-semibold text-primary">
                                                                {rec.iar_number}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                From:{' '}
                                                                {rec
                                                                    .purchase_order
                                                                    ?.supplier
                                                                    ?.name ??
                                                                    'Supplier'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-medium">
                                                                {
                                                                    rec.received_date
                                                                }
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                Accepted by:{' '}
                                                                {
                                                                    rec.receiver
                                                                        ?.name
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
